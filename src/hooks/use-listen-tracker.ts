import { useEffect, useRef } from "react";
import { isScrobbleEligible, listenedDelta, scrobbleThreshold } from "../app/scrobble";
import type { LibraryTrack } from "../app/types";

export type CountedPlay = {
  duration: number;
  /** Seconds really listened when the play counted (seeks excluded). */
  listened: number;
  /** Unix seconds. */
  startedAt: number;
  track: LibraryTrack;
  trackKey: string;
};

type PlayInstance = {
  counted: boolean;
  listened: number;
  previousTime: number;
  startNotified: boolean;
  startedAt: number | null;
};

const newInstance = (): PlayInstance => ({
  counted: false,
  listened: 0,
  previousTime: 0,
  startNotified: false,
  startedAt: null,
});

/**
 * Follows what is really listened to and reports two moments per play:
 * the song started (`onStart`, used for Last.fm "now playing") and the play
 * counts (`onCounted`, Last.fm's rule: half the song or 4 minutes, songs over
 * 30 s). History and scrobbling both hang off it, so they always agree.
 */
export function useListenTracker({
  activeDuration,
  isPlaying,
  onCounted,
  onStart,
  playbackTime,
  selectedTrack,
  trackKey,
}: {
  activeDuration: number;
  isPlaying: boolean;
  onCounted: (play: CountedPlay) => void;
  onStart: (track: LibraryTrack, duration: number) => void;
  playbackTime: number;
  selectedTrack: LibraryTrack;
  trackKey: string;
}) {
  const instanceRef = useRef<PlayInstance>(newInstance());
  const latestRef = useRef({ activeDuration, onCounted, onStart, selectedTrack });
  latestRef.current = { activeDuration, onCounted, onStart, selectedTrack };

  // Each song starts counting from zero.
  useEffect(() => {
    instanceRef.current = newInstance();
  }, [trackKey]);

  useEffect(() => {
    const { activeDuration: duration, selectedTrack: track } = latestRef.current;
    const instance = instanceRef.current;

    // The same song again (repeat one / restarted after finishing).
    if (instance.counted && playbackTime < 2 && instance.previousTime > duration - 5) {
      instanceRef.current = newInstance();
    }

    const current = instanceRef.current;
    if (isPlaying) {
      current.listened += listenedDelta(current.previousTime, playbackTime);
      current.startedAt ??= Date.now() / 1000;
    }
    current.previousTime = playbackTime;

    if (!isScrobbleEligible(duration)) return;

    // After the first second, so the duration already belongs to this song.
    if (isPlaying && playbackTime >= 1 && !current.startNotified) {
      current.startNotified = true;
      latestRef.current.onStart(track, duration);
    }

    if (!current.counted && current.listened >= scrobbleThreshold(duration)) {
      current.counted = true;
      latestRef.current.onCounted({
        duration,
        listened: current.listened,
        startedAt: current.startedAt ?? Date.now() / 1000,
        track,
        trackKey,
      });
    }
  }, [isPlaying, playbackTime, trackKey]);
}
