import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { LibraryTrack } from "../app/types";
import { getTrackArtworkSrc } from "../app/utils";

type UseMediaSessionOptions = {
  activeDuration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onTogglePlayback: () => void;
  selectedTrack: LibraryTrack;
};

const SEEK_STEP_SECONDS = 10;

/**
 * Publishes the current track to the OS media controls through the Media
 * Session API (Windows media overlay / hardware media keys, macOS Now Playing)
 * and routes their buttons to the player. A no-op where the API is missing.
 */
export function useMediaSession({
  activeDuration,
  audioRef,
  isPlaying,
  onNext,
  onPrevious,
  onSeek,
  onTogglePlayback,
  selectedTrack,
}: UseMediaSessionOptions) {
  const isSupported = typeof navigator !== "undefined" && "mediaSession" in navigator;
  const hasTrack = Boolean(selectedTrack.path || selectedTrack.source);
  const artworkSrc = getTrackArtworkSrc(selectedTrack);
  const latestRef = useRef({ hasTrack, isPlaying, onNext, onPrevious, onSeek, onTogglePlayback });
  latestRef.current = { hasTrack, isPlaying, onNext, onPrevious, onSeek, onTogglePlayback };

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    navigator.mediaSession.metadata = hasTrack
      ? new MediaMetadata({
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          album: selectedTrack.album,
          artwork: artworkSrc ? [{ src: artworkSrc, sizes: "512x512" }] : [],
        })
      : null;
  }, [artworkSrc, hasTrack, isSupported, selectedTrack.album, selectedTrack.artist, selectedTrack.title]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    navigator.mediaSession.playbackState = !hasTrack ? "none" : isPlaying ? "playing" : "paused";
  }, [hasTrack, isPlaying, isSupported]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const seekBy = (delta: number) => {
      const audio = audioRef.current;
      if (!audio || !latestRef.current.hasTrack) return;
      const duration = Number.isFinite(audio.duration) ? audio.duration : Number.POSITIVE_INFINITY;
      latestRef.current.onSeek(Math.min(Math.max(audio.currentTime + delta, 0), duration));
    };

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => { if (!latestRef.current.isPlaying) latestRef.current.onTogglePlayback(); }],
      ["pause", () => { if (latestRef.current.isPlaying) latestRef.current.onTogglePlayback(); }],
      ["previoustrack", () => latestRef.current.onPrevious()],
      ["nexttrack", () => latestRef.current.onNext()],
      ["seekbackward", (details) => seekBy(-(details.seekOffset ?? SEEK_STEP_SECONDS))],
      ["seekforward", (details) => seekBy(details.seekOffset ?? SEEK_STEP_SECONDS)],
      ["seekto", (details) => {
        if (typeof details.seekTime === "number" && latestRef.current.hasTrack) {
          latestRef.current.onSeek(details.seekTime);
        }
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported by this webview.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore.
        }
      }
    };
  }, [audioRef, isSupported]);

  // Position for the OS scrubber; refreshed on events, not on every tick.
  useEffect(() => {
    const audio = audioRef.current;

    if (!isSupported || !audio || !("setPositionState" in navigator.mediaSession)) {
      return;
    }

    const updatePosition = () => {
      const duration = audio.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        return;
      }

      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: audio.playbackRate || 1,
          position: Math.min(Math.max(audio.currentTime, 0), duration),
        });
      } catch {
        // Ignore inconsistent intermediate states.
      }
    };

    const events = ["loadedmetadata", "seeked", "ratechange", "play", "pause"] as const;
    events.forEach((name) => audio.addEventListener(name, updatePosition));
    updatePosition();

    return () => {
      events.forEach((name) => audio.removeEventListener(name, updatePosition));
    };
  }, [activeDuration, audioRef, isSupported]);
}
