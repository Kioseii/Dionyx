import { useEffect } from "react";
import type { MutableRefObject, RefObject, SyntheticEvent } from "react";

type UseAudioPlaybackOptions = {
  activeDuration: number;
  appLanguage: "es" | "en";
  audioRef: RefObject<HTMLAudioElement | null>;
  canUseEqualizerOnResolvedSource: (source: string | null) => boolean;
  clearPendingSourceSwap: () => void;
  ensureEqualizerGraph: () => Promise<boolean>;
  isEqualizerEnabled: boolean;
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
  resolvedTrackSource,
  selectedTrackTitle,
  setActiveDuration,
  setIsPlaying,
  setPlaybackTime,
  setStatusMessage,
  updateSelectedTrackDuration,
}: UseAudioPlaybackOptions) {
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

    if (isEqualizerEnabled && canUseEqualizerOnResolvedSource(resolvedTrackSource)) {
      void ensureEqualizerGraph().then((graphReady) => {
        if (!graphReady) {
          reportPlaybackError();
          return;
        }

        void audio.play().catch(() => {
          reportPlaybackError();
        });
      });
      return;
    }

    void audio.play().catch(() => {
      reportPlaybackError();
    });
  }, [
    appLanguage,
    audioRef,
    canUseEqualizerOnResolvedSource,
    ensureEqualizerGraph,
    isEqualizerEnabled,
    isPlaying,
    isSwappingSourceRef,
    resolvedTrackSource,
    selectedTrackTitle,
  ]);

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

    if (isEqualizerEnabled && canUseEqualizerOnResolvedSource(resolvedTrackSource)) {
      const graphReady = await ensureEqualizerGraph();

      if (!graphReady) {
        reportPlaybackError();
        return;
      }
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
        void audioElement.play().catch(() => {
          reportPlaybackError();
        });
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
