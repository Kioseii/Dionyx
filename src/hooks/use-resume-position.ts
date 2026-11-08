import { useEffect, useRef, type RefObject } from "react";
import { storageKeys } from "../app/constants";
import { readStoredValue, writeStoredValue } from "../app/utils";

type SavedPosition = { path: string; time: number };

const SAVE_EVERY_SECONDS = 5;

function readSavedPosition(): SavedPosition | null {
  try {
    const parsed = JSON.parse(readStoredValue(storageKeys.lastPosition) ?? "null");
    if (parsed && typeof parsed.path === "string" && Number.isFinite(parsed.time) && parsed.time >= 0) {
      return { path: parsed.path, time: parsed.time };
    }
  } catch {
    // Corrupt value: start from the beginning.
  }
  return null;
}

/**
 * Remembers where the current song was (every few seconds while playing and
 * right away when paused or closing) and, when the app opens on that same
 * song, moves to that second without starting playback.
 */
export function useResumePosition({
  audioRef,
  isPlaying,
  playbackTime,
  selectedTrackPath,
  setPlaybackTime,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  playbackTime: number;
  selectedTrackPath: string;
  setPlaybackTime: (value: number) => void;
}) {
  const pendingRef = useRef<SavedPosition | null>(readSavedPosition());
  const pathRef = useRef(selectedTrackPath);
  pathRef.current = selectedTrackPath;
  const lastSavedTimeRef = useRef<number | null>(null);

  // Another song was chosen before the saved one loaded: forget the restore.
  useEffect(() => {
    const pending = pendingRef.current;
    if (pending && selectedTrackPath && selectedTrackPath !== pending.path) {
      pendingRef.current = null;
    }
  }, [selectedTrackPath]);

  // Restore once the saved song's metadata (duration) is known.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    function apply() {
      const pending = pendingRef.current;
      if (!audio || !pending || pathRef.current !== pending.path) {
        return;
      }

      pendingRef.current = null;
      const duration = audio.duration;
      // Near the start or the very end there is nothing worth resuming.
      if (!Number.isFinite(duration) || pending.time < 2 || pending.time > duration - 3) {
        return;
      }

      audio.currentTime = pending.time;
      setPlaybackTime(pending.time);
    }

    // After the app's own loadedmetadata handling, which may reset the time.
    const onLoadedMetadata = () => window.setTimeout(apply, 0);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      onLoadedMetadata();
    }

    return () => audio.removeEventListener("loadedmetadata", onLoadedMetadata);
  }, [audioRef, selectedTrackPath, setPlaybackTime]);

  // Save: throttled while playing, immediately otherwise (pause, seek while paused).
  useEffect(() => {
    if (!selectedTrackPath || pendingRef.current) {
      return;
    }

    const last = lastSavedTimeRef.current;
    if (isPlaying && last !== null && Math.abs(playbackTime - last) < SAVE_EVERY_SECONDS) {
      return;
    }

    lastSavedTimeRef.current = playbackTime;
    writeStoredValue(storageKeys.lastPosition, JSON.stringify({ path: selectedTrackPath, time: playbackTime }));
  }, [isPlaying, playbackTime, selectedTrackPath]);

  // Closing the window: save the exact second.
  useEffect(() => {
    function flush() {
      const audio = audioRef.current;
      if (!audio || !pathRef.current || pendingRef.current) {
        return;
      }
      writeStoredValue(
        storageKeys.lastPosition,
        JSON.stringify({ path: pathRef.current, time: audio.currentTime }),
      );
    }

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [audioRef]);
}
