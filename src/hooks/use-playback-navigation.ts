import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { MutableRefObject, RefObject } from "react";
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
  const queueSignatureRef = useRef("");
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

    setCurrentTrackIndex(nextIndex);
    setPlaybackTime(0);
    setActiveDuration(0);

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

  useEffect(() => {
    if (playbackTracks.length === 0) {
      queueSignatureRef.current = "";

      if (playbackQueue.length > 0) {
        setPlaybackQueue([]);
      }

      if (queuePosition !== 0) {
        setQueuePosition(0);
      }

      return;
    }

    const displayIndices = displayTrackIndicesRef.current.filter(
      (trackIndex) => trackIndex >= 0 && trackIndex < playbackTracks.length,
    );
    const fallbackIndices = playbackTracks.map((_, trackIndex) => trackIndex);
    const boundedCurrentIndex = Math.min(currentTrackIndex, playbackTracks.length - 1);
    const sourceIndices =
      displayIndices.length > 0 ? displayIndices : fallbackIndices;
    const shouldRebuildAgainstVisibleSource = sourceIndices.includes(boundedCurrentIndex);
    const queueBaseIndices = shouldRebuildAgainstVisibleSource
      ? sourceIndices
      : playbackQueue.length > 0
        ? playbackQueue
        : fallbackIndices;
    const queueBaseSet = new Set(queueBaseIndices);
    const nextSignature = `${playbackPlaylistId ?? "library"}::${shuffleEnabled ? "shuffle" : "linear"}::${queueBaseIndices.join(",")}`;
    const queueMatchesSource =
      playbackQueue.length === queueBaseIndices.length &&
      playbackQueue.every((trackIndex) => queueBaseSet.has(trackIndex));
    const currentQueuePosition = playbackQueue.findIndex(
      (trackIndex) => trackIndex === boundedCurrentIndex,
    );

    if (
      queueSignatureRef.current !== nextSignature ||
      !queueMatchesSource ||
      (shouldRebuildAgainstVisibleSource && currentQueuePosition < 0)
    ) {
      const positionInDisplay = queueBaseIndices.indexOf(boundedCurrentIndex);
      const safePosition = positionInDisplay >= 0 ? positionInDisplay : 0;

      const nextQueue = shuffleEnabled
        ? buildShuffledQueueFromIndices(queueBaseIndices, safePosition)
        : [...queueBaseIndices];

      queueSignatureRef.current = nextSignature;
      setPlaybackQueue(nextQueue);
      setQueuePosition(Math.max(nextQueue.indexOf(boundedCurrentIndex), 0));
      return;
    }

    if (queuePosition !== currentQueuePosition) {
      setQueuePosition(currentQueuePosition);
    }
  }, [
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
