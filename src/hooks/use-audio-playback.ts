import { useEffect } from "react";
import type { MutableRefObject, RefObject, SyntheticEvent } from "react";
import { waitForPlaybackGate } from "../app/playback-gate";

type UseAudioPlaybackOptions = {
  activeDuration: number;
  appLanguage: "es" | "en";
  audioRef: RefObject<HTMLAudioElement | null>;
  canUseEqualizerOnResolvedSource: (source: string | null) => boolean;
  clearPendingSourceSwap: () => void;
  ensureEqualizerGraph: () => Promise<boolean>;
  isEqualizerEnabled: boolean;
  recoverFromSourceError: (onGiveUp: () => void) => boolean;
  resumeEqualizerGraph: () => Promise<boolean>;
  isPlaying: boolean;
  isSwappingSourceRef: MutableRefObject<boolean>;
  isTransitioningTrackRef: MutableRefObject<boolean>;
  pendingResumePlaybackRef: MutableRefObject<boolean>;
  pendingResumeTimeRef: MutableRefObject<number | null>;
  resolvedTrackSource: string | null;
  selectedTrackTitle: string;
  setActiveDuration: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackTime: (value: number) => void;
  setStatusMessage: (value: string) => void;
  updateSelectedTrackDuration: (seconds: number) => void;
};

export function useAudioPlayback({
  appLanguage,
  audioRef,
  canUseEqualizerOnResolvedSource,
  clearPendingSourceSwap,
  ensureEqualizerGraph,
  isEqualizerEnabled,
  isPlaying,
  isSwappingSourceRef,
  isTransitioningTrackRef,
  pendingResumePlaybackRef,
  pendingResumeTimeRef,
  recoverFromSourceError,
  resolvedTrackSource,
  resumeEqualizerGraph,
  selectedTrackTitle,
  setActiveDuration,
  setIsPlaying,
  setPlaybackTime,
  setStatusMessage,
  updateSelectedTrackDuration,
}: UseAudioPlaybackOptions) {
  /**
   * Gets the audio path ready before play(): builds the EQ graph when the EQ is
   * on, and otherwise just resumes an existing graph's context (once attached,
   * the element is silent while that context is suspended).
   */
  function prepareAudioOutput() {
    return isEqualizerEnabled && canUseEqualizerOnResolvedSource(resolvedTrackSource)
      ? ensureEqualizerGraph()
      : resumeEqualizerGraph();
  }

  function reportPlaybackError() {
    setIsPlaying(false);
    setStatusMessage(
      appLanguage === "es"
        ? "No pude reproducir esa pista. Prueba otra cancion o vuelve a escanear."
        : "I could not play that track. Try another song or rescan the folder.",
    );
  }

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !resolvedTrackSource) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    if (isSwappingSourceRef.current) {
      return;
    }

    if (!audio.paused && audio.currentSrc === resolvedTrackSource) {
      return;
    }

    void prepareAudioOutput().then(async (outputReady) => {
      if (!outputReady) {
        reportPlaybackError();
        return;
      }

      // Gapless: the end of the previous song may still be playing on the
      // tail element; start right when it finishes (or not at all if cancelled).
      if (!(await waitForPlaybackGate())) {
        return;
      }

      void audio.play().catch(() => {
        reportPlaybackError();
      });
    });
  // All callbacks used here are stable; re-run only when playback intent,
  // the source or the EQ switch change (not on every timeupdate render).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef, isEqualizerEnabled, isPlaying, resolvedTrackSource]);

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!resolvedTrackSource) {
      setStatusMessage(
        appLanguage === "es"
          ? "Escanea una carpeta con audio para empezar a reproducir."
          : "Scan a folder with audio to start playback.",
      );
      return;
    }

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const outputReady = await prepareAudioOutput();

    if (!outputReady) {
      reportPlaybackError();
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      reportPlaybackError();
    }
  }

  function handleAudioLoadedMetadata(event: SyntheticEvent<HTMLAudioElement>) {
    const audioElement = event.currentTarget;
    const nextDuration = audioElement.duration;
    setActiveDuration(nextDuration);
    updateSelectedTrackDuration(nextDuration);

    if (isSwappingSourceRef.current) {
      const pendingTime = pendingResumeTimeRef.current;

      if (typeof pendingTime === "number" && Number.isFinite(pendingTime)) {
        audioElement.currentTime = Math.min(
          pendingTime,
          Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : pendingTime,
        );
        setPlaybackTime(audioElement.currentTime);
      }

      const shouldResumePlayback = pendingResumePlaybackRef.current;
      clearPendingSourceSwap();

      if (shouldResumePlayback) {
        void prepareAudioOutput().then(() =>
          audioElement.play().catch(() => {
            reportPlaybackError();
          }),
        );
      }
    }
  }

  function handleAudioPause() {
    if (isSwappingSourceRef.current || isTransitioningTrackRef.current) {
      return;
    }

    setIsPlaying(false);
  }

  function handleAudioPlay() {
    setIsPlaying(true);
  }

  function handleAudioError() {
    // A CORS-mode load can fail on some webviews: retry this track from a
    // blob copy before telling the user anything.
    if (recoverFromSourceError(reportSourceError)) {
      return;
    }

    reportSourceError();
  }

  function reportSourceError() {
    clearPendingSourceSwap();
    setIsPlaying(false);
    setStatusMessage(
      appLanguage === "es"
        ? `No pude reproducir "${selectedTrackTitle}". Si el archivo existe, el siguiente paso es revisar soporte del codec o metadatos.`
        : `I could not play "${selectedTrackTitle}". If the file exists, the next step is checking codec support or metadata.`,
    );
  }

  return {
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    reportPlaybackError,
    togglePlayback,
  };
}
