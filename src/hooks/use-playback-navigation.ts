import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { MutableRefObject, RefObject } from "react";
import { planQueueUpdate, type QueueBuildState } from "../app/queue";
import type { LibrarySortKey, LibraryTrack, RepeatMode } from "../app/types";
import {
  buildShuffledQueueFromIndices,
  isTauriRuntime,
  snapPlaybackRate,
} from "../app/utils";
import { SPEED_PRESETS } from "../app/constants";

type UsePlaybackNavigationOptions = {
  activePlaylistId: string | null;
  activeDuration: number;
  audioPreloadRef: RefObject<HTMLAudioElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrackIndex: number;
  displayTrackIndicesRef: MutableRefObject<number[]>;
  handleSeek: (value: number) => void;
  isTransitioningTrackRef: MutableRefObject<boolean>;
  librarySortKey: LibrarySortKey;
  playbackPlaylistId: string | null;
  playbackTracks: LibraryTrack[];
  playbackTime: number;
  setActiveDuration: (value: number) => void;
  setCurrentTrackIndex: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackPlaylistId: (value: string | null) => void;
  setPlaybackTime: (value: number) => void;
};

export function usePlaybackNavigation({
  activePlaylistId,
  activeDuration,
  audioPreloadRef,
  audioRef,
  currentTrackIndex,
  displayTrackIndicesRef,
  handleSeek,
  isTransitioningTrackRef,
  librarySortKey,
  playbackPlaylistId,
  playbackTime,
  playbackTracks,
  setActiveDuration,
  setCurrentTrackIndex,
  setIsPlaying,
  setPlaybackPlaylistId,
  setPlaybackTime,
}: UsePlaybackNavigationOptions) {
  const queueBuildStateRef = useRef<QueueBuildState | null>(null);
  const hasLibrary = playbackTracks.length > 0;
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [playbackQueue, setPlaybackQueue] = useState<number[]>([]);
  const [queuePosition, setQueuePosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  function jumpToTrackIndex(nextIndex: number, shouldAutoplay = true) {
    if (nextIndex < 0 || nextIndex >= playbackTracks.length) {
      return;
    }

    const audio = audioRef.current;

    // Same track again (e.g. "repeat all" over a one-track queue): the source
    // does not change, so nothing else would restart the ended element.
    if (nextIndex === currentTrackIndex && shouldAutoplay && audio?.ended) {
      audio.currentTime = 0;
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    }

    setCurrentTrackIndex(nextIndex);
    setPlaybackTime(0);
    setActiveDuration(nextIndex === currentTrackIndex && audio ? audio.duration || 0 : 0);

    if (shouldAutoplay) {
      setIsPlaying(true);
    }
  }

  function jumpToQueuePosition(nextPosition: number, shouldAutoplay = true) {
    const nextIndex = playbackQueue[nextPosition];

    if (typeof nextIndex !== "number") {
      return;
    }

    setQueuePosition(nextPosition);
    jumpToTrackIndex(nextIndex, shouldAutoplay);
  }

  function handleTrackEnded() {
    const audio = audioRef.current;

    if (repeatMode === "one" && audio) {
      audio.currentTime = 0;
      setPlaybackTime(0);
      setActiveDuration(audio.duration || activeDuration);
      setIsPlaying(true);
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    const hasNextTrack = queuePosition < playbackQueue.length - 1;

    if (hasNextTrack) {
      isTransitioningTrackRef.current = true;
      jumpToQueuePosition(queuePosition + 1);
      setTimeout(() => {
        isTransitioningTrackRef.current = false;
      }, 300);
      return;
    }

    if (repeatMode === "all" && playbackQueue.length > 0) {
      isTransitioningTrackRef.current = true;
      jumpToQueuePosition(0);
      setTimeout(() => {
        isTransitioningTrackRef.current = false;
      }, 300);
      return;
    }

    setIsPlaying(false);
    setPlaybackTime(0);
  }

  function selectTrack(index: number, shouldAutoplay = false) {
    const displayIndices = displayTrackIndicesRef.current;
    const positionInDisplay = displayIndices.indexOf(index);
    const safePosition = positionInDisplay >= 0 ? positionInDisplay : 0;

    setPlaybackPlaylistId(activePlaylistId);

    // Same source: remember the visible order as the pre-shuffle order. (A
    // source change is picked up by the queue effect, which rebuilds it.)
    if (activePlaylistId === playbackPlaylistId && queueBuildStateRef.current) {
      queueBuildStateRef.current = {
        ...queueBuildStateRef.current,
        linearBase: [...displayIndices],
      };
    }

    if (shuffleEnabled) {
      setPlaybackQueue(buildShuffledQueueFromIndices(displayIndices, safePosition));
      setQueuePosition(0);
    } else {
      setPlaybackQueue([...displayIndices]);
      setQueuePosition(safePosition);
    }

    jumpToTrackIndex(index, shouldAutoplay);
  }

  function playPreviousTrack() {
    if (!hasLibrary) {
      return;
    }

    if (playbackTime > 3) {
      handleSeek(0);
      return;
    }

    if (queuePosition > 0) {
      jumpToQueuePosition(queuePosition - 1);
      return;
    }

    if (repeatMode === "all" && playbackQueue.length > 0) {
      jumpToQueuePosition(playbackQueue.length - 1);
      return;
    }

    jumpToQueuePosition(0);
  }

  function playNextTrack() {
    if (!hasLibrary) {
      return;
    }

    if (queuePosition < playbackQueue.length - 1) {
      jumpToQueuePosition(queuePosition + 1);
      return;
    }

    if (repeatMode === "all" && playbackQueue.length > 0) {
      jumpToQueuePosition(0);
    }
  }

  function toggleShuffle() {
    setShuffleEnabled((currentValue) => !currentValue);
  }

  function cycleRepeatMode() {
    setRepeatMode((currentMode) => {
      if (currentMode === "off") {
        return "all";
      }

      if (currentMode === "all") {
        return "one";
      }

      return "off";
    });
  }

  function cyclePlaybackRate() {
    setPlaybackRate((current) => {
      const snappedCurrent = snapPlaybackRate(current);
      const idx = SPEED_PRESETS.indexOf(snappedCurrent);
      return SPEED_PRESETS[(idx + 1) % SPEED_PRESETS.length] ?? 1;
    });
  }

  // The queue belongs to the list that is playing. The visible list only
  // shapes it when it IS that list; browsing another view or typing in the
  // search box never reshapes a running queue (see planQueueUpdate).
  useEffect(() => {
    const plan = planQueueUpdate({
      previous: queueBuildStateRef.current,
      sourceId: playbackPlaylistId ?? "library",
      sourceLength: playbackTracks.length,
      shuffle: shuffleEnabled,
      sortKey: librarySortKey,
      currentIndex: currentTrackIndex,
      queue: playbackQueue,
      queuePosition,
      viewIndices: activePlaylistId === playbackPlaylistId ? displayTrackIndicesRef.current : null,
    });

    if (plan.kind === "rebuild") {
      queueBuildStateRef.current = plan.state;
      setPlaybackQueue(plan.queue);
      setQueuePosition(plan.position);
    } else if (plan.kind === "position") {
      setQueuePosition(plan.position);
    }
  }, [
    activePlaylistId,
    currentTrackIndex,
    displayTrackIndicesRef,
    librarySortKey,
    playbackPlaylistId,
    playbackQueue,
    playbackTracks.length,
    queuePosition,
    shuffleEnabled,
  ]);

  useEffect(() => {
    if (currentTrackIndex >= playbackTracks.length && playbackTracks.length > 0) {
      setCurrentTrackIndex(0);
    }
  }, [currentTrackIndex, playbackTracks.length, setCurrentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [audioRef, playbackRate]);

  useEffect(() => {
    const preload = audioPreloadRef.current;

    if (!preload || !isTauriRuntime()) {
      return;
    }

    const nextPosition = queuePosition + 1;
    const nextTrackIndex = playbackQueue[nextPosition];

    if (typeof nextTrackIndex !== "number") {
      return;
    }

    const nextTrack = playbackTracks[nextTrackIndex];

    if (!nextTrack?.path) {
      return;
    }

    const nextSrc = convertFileSrc(nextTrack.path);

    if (preload.src !== nextSrc) {
      preload.src = nextSrc;
      preload.load();
    }
  }, [audioPreloadRef, playbackQueue, playbackTracks, queuePosition]);

  return {
    cyclePlaybackRate,
    cycleRepeatMode,
    handleTrackEnded,
    jumpToQueuePosition,
    playbackQueue,
    playbackRate,
    playNextTrack,
    playPreviousTrack,
    queuePosition,
    repeatMode,
    selectTrack,
    setShuffleEnabled,
    shuffleEnabled,
    toggleShuffle,
  };
}
