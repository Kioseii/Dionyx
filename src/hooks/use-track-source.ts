import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { MutableRefObject, RefObject } from "react";

type UseTrackSourceOptions = {
  appLanguage: "es" | "en";
  audioContextRef: MutableRefObject<AudioContext | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  isEqualizerEnabled: boolean;
  resetEqualizerGraph: () => Promise<void>;
  selectedTrackKey: string;
  selectedTrackPath: string;
  selectedTrackSource?: string;
  setStatusMessage: (value: string) => void;
};

export function useTrackSource({
  appLanguage,
  audioContextRef,
  audioRef,
  isEqualizerEnabled,
  resetEqualizerGraph,
  selectedTrackKey,
  selectedTrackPath,
  selectedTrackSource,
  setStatusMessage,
}: UseTrackSourceOptions) {
  const tauriSourceCacheRef = useRef(new Map<string, string>());
  const appliedTrackKeyRef = useRef<string | null>(null);
  const isSwappingSourceRef = useRef(false);
  const pendingResumeTimeRef = useRef<number | null>(null);
  const pendingResumePlaybackRef = useRef(false);
  const [resolvedTrackSource, setResolvedTrackSource] = useState<string | null>(null);

  function revokeTauriSources() {
    tauriSourceCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    tauriSourceCacheRef.current.clear();
  }

  function clearPendingSourceSwap() {
    isSwappingSourceRef.current = false;
    pendingResumeTimeRef.current = null;
    pendingResumePlaybackRef.current = false;
  }

  function canUseEqualizerOnResolvedSource(source: string | null) {
    return typeof source === "string" && source.startsWith("blob:");
  }

  async function prepareTauriEqualizerSource(trackPath: string) {
    const cachedSource = tauriSourceCacheRef.current.get(trackPath);

    if (cachedSource) {
      return cachedSource;
    }

    const fastSource = convertFileSrc(trackPath);
    const response = await fetch(fastSource);

    if (!response.ok) {
      throw new Error(`Audio fetch failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    tauriSourceCacheRef.current.set(trackPath, objectUrl);

    return objectUrl;
  }

  useEffect(() => {
    return () => {
      revokeTauriSources();
    };
  }, []);

  useEffect(() => {
    let isDisposed = false;

    async function resolveTrackSource() {
      if (!selectedTrackSource && !selectedTrackPath) {
        setResolvedTrackSource(null);
        return;
      }

      if (selectedTrackSource) {
        setResolvedTrackSource(selectedTrackSource);
        return;
      }

      if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window) || !selectedTrackPath) {
        setResolvedTrackSource(null);
        return;
      }

      const fastSource = convertFileSrc(selectedTrackPath);

      if (!isEqualizerEnabled) {
        if (!audioContextRef.current) {
          setResolvedTrackSource(fastSource);
          return;
        }
      }

      const cachedSource = tauriSourceCacheRef.current.get(selectedTrackPath);

      if (cachedSource) {
        setResolvedTrackSource(cachedSource);
        return;
      }

      setResolvedTrackSource(fastSource);

      try {
        const preparedSource = await prepareTauriEqualizerSource(selectedTrackPath);

        if (isDisposed) {
          return;
        }

        setResolvedTrackSource(preparedSource);
      } catch {
        if (isDisposed) {
          return;
        }

        setStatusMessage(
          appLanguage === "es"
            ? "No pude preparar el archivo de audio para reproducirlo con el ecualizador."
            : "I could not prepare the audio file for equalizer playback.",
        );
      }
    }

    void resolveTrackSource();

    return () => {
      isDisposed = true;
    };
  }, [
    appLanguage,
    audioContextRef,
    isEqualizerEnabled,
    selectedTrackKey,
    selectedTrackPath,
    selectedTrackSource,
    setStatusMessage,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!resolvedTrackSource) {
      clearPendingSourceSwap();
      appliedTrackKeyRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    const shouldPreservePosition =
      appliedTrackKeyRef.current === selectedTrackKey &&
      Boolean(audio.currentSrc) &&
      audio.currentSrc !== resolvedTrackSource;

    if (shouldPreservePosition) {
      pendingResumeTimeRef.current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      pendingResumePlaybackRef.current = !audio.paused;
      isSwappingSourceRef.current = true;
    } else {
      clearPendingSourceSwap();
    }

    if (
      !isEqualizerEnabled &&
      !canUseEqualizerOnResolvedSource(resolvedTrackSource) &&
      audioContextRef.current
    ) {
      void resetEqualizerGraph();
    }

    audio.src = resolvedTrackSource;
    audio.load();
    appliedTrackKeyRef.current = selectedTrackKey;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTrackSource]);

  return {
    canUseEqualizerOnResolvedSource,
    clearPendingSourceSwap,
    isSwappingSourceRef,
    pendingResumePlaybackRef,
    pendingResumeTimeRef,
    resolvedTrackSource,
  };
}
