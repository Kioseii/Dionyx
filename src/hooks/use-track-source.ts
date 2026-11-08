import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { RefObject } from "react";
import { isTauriRuntime } from "../app/utils";

type UseTrackSourceOptions = {
  appLanguage: "es" | "en";
  audioRef: RefObject<HTMLAudioElement | null>;
  hasEqualizerGraph: () => boolean;
  isEqualizerEnabled: boolean;
  isPlaying: boolean;
  selectedTrackKey: string;
  selectedTrackPath: string;
  selectedTrackSource?: string;
  setStatusMessage: (value: string) => void;
};

type AppliedSource = {
  cors: boolean;
  key: string | null;
  src: string | null;
};

/**
 * Resolves and applies the <audio> source for the selected track.
 *
 * Local files are always played straight from Tauri's asset protocol. When the
 * equalizer graph is (or is about to be) attached, the element loads in CORS
 * mode (`crossOrigin="anonymous"`): the asset protocol answers with
 * Access-Control-Allow-Origin, so Web Audio receives real samples instead of
 * silence. This replaces the old approach of reading every track fully into a
 * blob (unbounded memory with large FLAC libraries).
 *
 * If a CORS-mode load fails on some platform, the current track alone falls
 * back to a blob copy; only one such blob exists at a time.
 */
export function useTrackSource({
  appLanguage,
  audioRef,
  hasEqualizerGraph,
  isEqualizerEnabled,
  isPlaying,
  selectedTrackKey,
  selectedTrackPath,
  selectedTrackSource,
  setStatusMessage,
}: UseTrackSourceOptions) {
  const appliedRef = useRef<AppliedSource>({ cors: false, key: null, src: null });
  const isSwappingSourceRef = useRef(false);
  const pendingResumeTimeRef = useRef<number | null>(null);
  const pendingResumePlaybackRef = useRef(false);
  const resumeAfterFallbackRef = useRef(false);
  const fallbackAttemptedPathsRef = useRef(new Set<string>());
  const [blobFallback, setBlobFallback] = useState<{ path: string; url: string } | null>(null);
  const selectedTrackPathRef = useRef(selectedTrackPath);
  selectedTrackPathRef.current = selectedTrackPath;

  const directSource = selectedTrackSource
    ? selectedTrackSource
    : selectedTrackPath && isTauriRuntime()
      ? convertFileSrc(selectedTrackPath)
      : null;
  const resolvedTrackSource =
    blobFallback && !selectedTrackSource && blobFallback.path === selectedTrackPath
      ? blobFallback.url
      : directSource;
  // Once the element feeds the Web Audio graph it must stay CORS-clean.
  const requiresCors = isEqualizerEnabled || hasEqualizerGraph();

  const clearPendingSourceSwap = useCallback(() => {
    isSwappingSourceRef.current = false;
    pendingResumeTimeRef.current = null;
    pendingResumePlaybackRef.current = false;
  }, []);

  /** True when Web Audio can process the currently applied source. */
  const canUseEqualizerOnResolvedSource = useCallback((source: string | null) => {
    if (typeof source !== "string") {
      return false;
    }

    const applied = appliedRef.current;
    return source.startsWith("blob:") || (applied.src === source && applied.cors);
  }, []);

  // Only the current track may hold a blob copy.
  useEffect(() => {
    if (blobFallback && blobFallback.path !== selectedTrackPath) {
      URL.revokeObjectURL(blobFallback.url);
      setBlobFallback(null);
    }
  }, [blobFallback, selectedTrackPath]);

  const blobFallbackRef = useRef(blobFallback);
  blobFallbackRef.current = blobFallback;
  useEffect(() => {
    return () => {
      if (blobFallbackRef.current) {
        URL.revokeObjectURL(blobFallbackRef.current.url);
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!resolvedTrackSource) {
      clearPendingSourceSwap();
      appliedRef.current = { cors: false, key: null, src: null };
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    const applied = appliedRef.current;

    if (applied.src === resolvedTrackSource && applied.cors === requiresCors) {
      return;
    }

    const shouldPreservePosition =
      applied.key === selectedTrackKey && Boolean(audio.currentSrc);

    if (shouldPreservePosition) {
      pendingResumeTimeRef.current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      pendingResumePlaybackRef.current = !audio.paused || resumeAfterFallbackRef.current;
      isSwappingSourceRef.current = true;
    } else {
      clearPendingSourceSwap();
    }

    resumeAfterFallbackRef.current = false;

    if (requiresCors) {
      audio.crossOrigin = "anonymous";
    } else {
      audio.removeAttribute("crossorigin");
    }

    audio.src = resolvedTrackSource;
    audio.load();
    appliedRef.current = { cors: requiresCors, key: selectedTrackKey, src: resolvedTrackSource };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTrackSource, requiresCors]);

  /**
   * Called from the <audio> error handler. Returns true when it took over the
   * error by retrying the current track from a blob copy; `onGiveUp` runs if
   * that retry also fails.
   */
  const recoverFromSourceError = useCallback(
    (onGiveUp: () => void) => {
      const applied = appliedRef.current;
      const path = selectedTrackPath;

      if (
        !applied.cors ||
        !applied.src ||
        applied.src.startsWith("blob:") ||
        selectedTrackSource ||
        !path ||
        fallbackAttemptedPathsRef.current.has(path)
      ) {
        return false;
      }

      fallbackAttemptedPathsRef.current.add(path);
      const sourceToFetch = applied.src;
      const shouldResume = isPlaying;

      void (async () => {
        try {
          const response = await fetch(sourceToFetch);

          if (!response.ok) {
            throw new Error(`Audio fetch failed with status ${response.status}`);
          }

          const url = URL.createObjectURL(await response.blob());

          if (path !== selectedTrackPathRef.current) {
            URL.revokeObjectURL(url);
            return;
          }

          resumeAfterFallbackRef.current = shouldResume;
          setBlobFallback({ path, url });
        } catch {
          setStatusMessage(
            appLanguage === "es"
              ? "No pude preparar el archivo de audio para reproducirlo con el ecualizador."
              : "I could not prepare the audio file for equalizer playback.",
          );
          onGiveUp();
        }
      })();

      return true;
    },
    [appLanguage, isPlaying, selectedTrackPath, selectedTrackSource, setStatusMessage],
  );

  return {
    canUseEqualizerOnResolvedSource,
    clearPendingSourceSwap,
    isSwappingSourceRef,
    pendingResumePlaybackRef,
    pendingResumeTimeRef,
    recoverFromSourceError,
    resolvedTrackSource,
  };
}
