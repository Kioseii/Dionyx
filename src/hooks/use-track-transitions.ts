import { useEffect, useRef, type RefObject } from "react";
import { holdNextPlayback, isPlaybackHeld } from "../app/playback-gate";
import {
  crossfadeGains,
  getTransitionLead,
  getTransitionMode,
  shouldStartTransition,
  type TransitionMode,
} from "../app/transitions";

type UseTrackTransitionsOptions = {
  /** Moves the queue to the next song (the normal "song ended" path). */
  advance: () => void;
  attachElementToEqualizer: (element: HTMLMediaElement) => Promise<boolean>;
  audioRef: RefObject<HTMLAudioElement | null>;
  /** Repeat-one or the sleep timer's "end of song": let the song end normally. */
  blocked: boolean;
  crossfadeSeconds: number;
  gapless: boolean;
  hasNextTrack: boolean;
  isPlaying: boolean;
  selectedTrackPath: string;
  volume: number;
};

type ActiveTransition = { cancel: (shouldPlay: boolean) => void };

const CHECK_INTERVAL_MS = 100;
const FADE_STEP_MS = 50;
const LOAD_TIMEOUT_MS = 2000;

function waitForMediaEvent(element: HTMLMediaElement, eventName: string, timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => done(false), timeoutMs);
    const onEvent = () => done(true);
    const onError = () => done(false);

    function done(result: boolean) {
      window.clearTimeout(timer);
      element.removeEventListener(eventName, onEvent);
      element.removeEventListener("error", onError);
      resolve(result);
    }

    element.addEventListener(eventName, onEvent);
    element.addEventListener("error", onError);
  });
}

/**
 * Gapless playback and crossfade between songs.
 *
 * The app drives one main <audio> element (time, seek, lyrics, media keys all
 * read it), and that element can join the equalizer graph only once. So
 * instead of swapping elements, near the end of a song its remaining seconds
 * move to a second "tail" element (same file, same position, same EQ) and
 * the main element goes on to the next song as usual:
 *  - crossfade: both play together while the volumes cross (equal power);
 *  - gapless: the next song loads meanwhile and starts the moment the tail
 *    finishes, instead of after the usual load pause.
 */
export function useTrackTransitions(options: UseTrackTransitionsOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const tailRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<ActiveTransition | null>(null);
  const expectPathChangeRef = useRef(false);
  const failedSourceRef = useRef<string | null>(null);

  const mode = getTransitionMode(options.gapless, options.crossfadeSeconds);
  const lead = getTransitionLead(mode, options.crossfadeSeconds);

  useEffect(() => {
    if (!options.isPlaying || mode === "off") {
      return;
    }

    const id = window.setInterval(() => {
      const audio = optionsRef.current.audioRef.current;
      const current = optionsRef.current;

      if (!audio || activeRef.current || failedSourceRef.current === audio.currentSrc) {
        return;
      }

      const ready = shouldStartTransition({
        blocked: current.blocked || audio.paused || audio.seeking || isPlaybackHeld(),
        currentTime: audio.currentTime,
        duration: audio.duration,
        hasNextTrack: current.hasNextTrack,
        lead,
        mode,
      });

      if (ready) {
        void startTransition(audio, mode, lead);
      }
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(id);
  // startTransition only reads refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.isPlaying, mode, lead]);

  // Paused during a transition: silence the tail and keep the next song paused.
  useEffect(() => {
    if (!options.isPlaying) {
      activeRef.current?.cancel(false);
    }
  }, [options.isPlaying]);

  // A song chosen by the user (not by the transition itself) ends it at once.
  useEffect(() => {
    if (expectPathChangeRef.current) {
      expectPathChangeRef.current = false;
      return;
    }

    activeRef.current?.cancel(true);
    failedSourceRef.current = null;
  }, [options.selectedTrackPath]);

  useEffect(() => {
    return () => {
      activeRef.current?.cancel(false);
    };
  }, []);

  async function startTransition(main: HTMLAudioElement, transitionMode: TransitionMode, leadSeconds: number) {
    const tail = tailRef.current ?? new Audio();
    tailRef.current = tail;
    tail.preload = "auto";

    let finished = false;
    let fadeTimer = 0;
    let safetyTimer = 0;
    let releaseGate: ((shouldPlay: boolean) => void) | null = null;

    const finish = (shouldPlay: boolean) => {
      if (finished) return;
      finished = true;
      if (activeRef.current === transition) activeRef.current = null;
      window.clearInterval(fadeTimer);
      window.clearTimeout(safetyTimer);
      tail.onended = null;
      tail.pause();
      tail.removeAttribute("src");
      tail.load();
      main.volume = optionsRef.current.volume;
      releaseGate?.(shouldPlay);
    };
    const transition: ActiveTransition = { cancel: finish };
    activeRef.current = transition;

    const source = main.currentSrc || main.src;
    const fail = () => {
      failedSourceRef.current = source;
      finish(true);
    };

    // 1. Same file, same settings, same EQ path on the tail element.
    tail.crossOrigin = main.crossOrigin;
    tail.playbackRate = main.playbackRate;
    tail.volume = main.volume;

    if (!(await optionsRef.current.attachElementToEqualizer(tail)) || finished) {
      fail();
      return;
    }

    const metadata = waitForMediaEvent(tail, "loadedmetadata", LOAD_TIMEOUT_MS);
    tail.src = source;
    if (!(await metadata) || finished) {
      fail();
      return;
    }

    // 2. Line it up with the main element (a small head start covers the seek).
    const seeked = waitForMediaEvent(tail, "seeked", LOAD_TIMEOUT_MS);
    tail.currentTime = Math.min(main.currentTime + 0.03, tail.duration);
    if (!(await seeked) || finished || main.paused || (main.currentSrc || main.src) !== source) {
      fail();
      return;
    }

    try {
      await tail.play();
    } catch {
      fail();
      return;
    }

    if (finished) {
      return;
    }

    // 3. Hand over: the main element moves on to the next song.
    if (transitionMode === "gapless") {
      releaseGate = holdNextPlayback();
      tail.onended = () => finish(true);
      safetyTimer = window.setTimeout(() => finish(true), (leadSeconds + 3) * 1000);
    } else {
      main.volume = 0;
      const startedAt = performance.now();
      fadeTimer = window.setInterval(() => {
        const progress = (performance.now() - startedAt) / (leadSeconds * 1000);
        const gains = crossfadeGains(progress);
        const volume = optionsRef.current.volume;
        main.volume = volume * gains.incoming;
        tail.volume = volume * gains.outgoing;
        if (progress >= 1) finish(true);
      }, FADE_STEP_MS);
    }

    expectPathChangeRef.current = true;
    optionsRef.current.advance();
  }
}
