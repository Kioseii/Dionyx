import { useRef, useState } from "react";
import type { RefObject } from "react";

type UsePlaybackScrubOptions = {
  activeDuration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  playbackTime: number;
  setPlaybackTime: (value: number) => void;
};

export function usePlaybackScrub({
  activeDuration,
  audioRef,
  playbackTime,
  setPlaybackTime,
}: UsePlaybackScrubOptions) {
  const isProgressScrubbingRef = useRef(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  const displayedPlaybackTime =
    scrubPreviewTime !== null
      ? Math.min(scrubPreviewTime, activeDuration > 0 ? activeDuration : scrubPreviewTime)
      : Math.min(playbackTime, activeDuration > 0 ? activeDuration : playbackTime);

  function handleSeek(nextTime: number) {
    isProgressScrubbingRef.current = false;
    setScrubPreviewTime(null);

    const audio = audioRef.current;

    if (!audio || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setPlaybackTime(nextTime);
  }

  function beginProgressScrub() {
    isProgressScrubbingRef.current = true;
  }

  function updateProgressScrub(nextTime: number) {
    if (!Number.isFinite(nextTime)) {
      return;
    }

    if (!isProgressScrubbingRef.current) {
      isProgressScrubbingRef.current = true;
    }

    setScrubPreviewTime(nextTime);
  }

  return {
    beginProgressScrub,
    displayedPlaybackTime,
    handleSeek,
    updateProgressScrub,
  };
}
