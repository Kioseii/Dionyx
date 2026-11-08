import type { MutableRefObject, RefObject } from "react";
import type { LibraryTrack, SavedPlaylist } from "../app/types";
import { useAudioPlayback } from "./use-audio-playback";
import { useEqualizer } from "./use-equalizer";
import { useEqualizerControls } from "./use-equalizer-controls";
import { useTrackDurationSync } from "./use-track-duration-sync";
import { useTrackSource } from "./use-track-source";

type UseAudioRuntimeStackOptions = {
  activeDuration: number;
  appLanguage: "es" | "en";
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrackTitle: string;
  equalizerUnavailableMessage: string;
  equalizerValues: number[];
  isEqualizerEnabled: boolean;
  isPlaying: boolean;
  isTransitioningTrackRef: MutableRefObject<boolean>;
  selectedTrack: LibraryTrack;
  selectedTrackKey: string;
  setActiveDuration: (value: number) => void;
  setEqualizerValues: (value: number[] | ((currentValue: number[]) => number[])) => void;
  setIsEqualizerEnabled: (value: boolean) => void;
  setIsEqualizerPresetMenuOpen: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackTime: (value: number) => void;
  setSavedPlaylists: (
    value: SavedPlaylist[] | ((previousPlaylists: SavedPlaylist[]) => SavedPlaylist[]),
  ) => void;
  setSelectedEqualizerPresetId: (value: string) => void;
  setStatusMessage: (value: string) => void;
  setTracks: (value: LibraryTrack[] | ((previousTracks: LibraryTrack[]) => LibraryTrack[])) => void;
};

export function useAudioRuntimeStack({
  activeDuration,
  appLanguage,
  audioRef,
  currentTrackTitle,
  equalizerUnavailableMessage,
  equalizerValues,
  isEqualizerEnabled,
  isPlaying,
  isTransitioningTrackRef,
  selectedTrack,
  selectedTrackKey,
  setActiveDuration,
  setEqualizerValues,
  setIsEqualizerEnabled,
  setIsEqualizerPresetMenuOpen,
  setIsPlaying,
  setPlaybackTime,
  setSavedPlaylists,
  setSelectedEqualizerPresetId,
  setStatusMessage,
  setTracks,
}: UseAudioRuntimeStackOptions) {
  const {
    attachElementToEqualizer,
    ensureEqualizerGraph,
    hasEqualizerGraph,
    isEqualizerSupported,
    resumeEqualizerGraph,
  } = useEqualizer({
    audioRef,
    equalizerValues,
    isEqualizerEnabled,
  });
  const {
    canUseEqualizerOnResolvedSource,
    clearPendingSourceSwap,
    isSwappingSourceRef,
    pendingResumePlaybackRef,
    pendingResumeTimeRef,
    recoverFromSourceError,
    resolvedTrackSource,
  } = useTrackSource({
    appLanguage,
    audioRef,
    hasEqualizerGraph,
    isEqualizerEnabled,
    isPlaying,
    selectedTrackKey,
    selectedTrackPath: selectedTrack.path,
    selectedTrackSource: selectedTrack.source,
    setStatusMessage,
  });
  const { updateSelectedTrackDuration } = useTrackDurationSync({
    selectedTrack,
    setSavedPlaylists,
    setTracks,
  });
  const {
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    togglePlayback,
  } = useAudioPlayback({
    activeDuration,
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
    selectedTrackTitle: currentTrackTitle,
    setActiveDuration,
    setIsPlaying,
    setPlaybackTime,
    setStatusMessage,
    updateSelectedTrackDuration,
  });
  const {
    applyEqualizerPreset,
    handleEqualizerToggle,
    updateEqualizerBand,
  } = useEqualizerControls({
    canUseEqualizerOnResolvedSource,
    ensureEqualizerGraph,
    isEqualizerEnabled,
    resolvedTrackSource,
    setEqualizerValues,
    setIsEqualizerEnabled,
    setIsEqualizerPresetMenuOpen,
    setSelectedEqualizerPresetId,
    setStatusMessage,
    unavailableMessage: equalizerUnavailableMessage,
  });

  return {
    applyEqualizerPreset,
    attachElementToEqualizer,
    canUseEqualizerOnResolvedSource,
    ensureEqualizerGraph,
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    handleEqualizerToggle,
    isEqualizerSupported,
    togglePlayback,
    updateEqualizerBand,
  };
}
