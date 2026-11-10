import type { RefObject } from "react";
import type { AppLanguage } from "../app/types";
import { useAppShellEffects } from "./use-app-shell-effects";
import { useDiscordPresence } from "./use-discord-presence";
import { useOverlayControls } from "./use-overlay-controls";
import { usePersistenceSync } from "./use-persistence-sync";

type UseAppGlobalEffectsOptions = {
  activeDuration: number;
  activePlaylistOpen: boolean;
  appLanguage: AppLanguage;
  audioRef: RefObject<HTMLAudioElement | null>;
  equalizerPresetMenuRef: RefObject<HTMLDivElement | null>;
  equalizerValues: number[];
  getItunesCover: (query: string, entity: "musicArtist" | "song", artist?: string) => Promise<string | null>;
  hideOnTray: boolean;
  isEqualizerEnabled: boolean;
  isEqualizerPresetMenuOpen: boolean;
  isLibrarySortMenuOpen: boolean;
  isPlaying: boolean;
  isPlaylistModalOpen: boolean;
  librarySortMenuRef: RefObject<HTMLDivElement | null>;
  selectedEqualizerPresetId: string;
  selectedTrackArtist: string;
  selectedTrackPath: string;
  selectedTrackTitle: string;
  setDragOverPlaylistTrackIndex: (value: number | null) => void;
  setDraggedPlaylistTrackIndex: (value: number | null) => void;
  setIsEqualizerPresetMenuOpen: (value: boolean) => void;
  setIsLibrarySortMenuOpen: (value: boolean) => void;
  setPlaylistSelectionQuery: (value: string) => void;
  setStatusMessage: (value: string) => void;
  volume: number;
  /** What the audio element plays at: volume × the song's normalization. */
  outputVolume: number;
};

export function useAppGlobalEffects({
  activeDuration,
  activePlaylistOpen,
  appLanguage,
  audioRef,
  equalizerPresetMenuRef,
  equalizerValues,
  getItunesCover,
  hideOnTray,
  isEqualizerEnabled,
  isEqualizerPresetMenuOpen,
  isLibrarySortMenuOpen,
  isPlaying,
  isPlaylistModalOpen,
  librarySortMenuRef,
  selectedEqualizerPresetId,
  selectedTrackArtist,
  selectedTrackPath,
  selectedTrackTitle,
  setDragOverPlaylistTrackIndex,
  setDraggedPlaylistTrackIndex,
  setIsEqualizerPresetMenuOpen,
  setIsLibrarySortMenuOpen,
  setPlaylistSelectionQuery,
  setStatusMessage,
  volume,
  outputVolume,
}: UseAppGlobalEffectsOptions) {
  usePersistenceSync({
    equalizerValues,
    hideOnTray,
    isEqualizerEnabled,
    selectedEqualizerPresetId,
    selectedTrackPath,
    volume,
  });

  useAppShellEffects({
    activePlaylistOpen,
    audioRef,
    isPlaylistModalOpen,
    setIsLibrarySortMenuOpen,
    setPlaylistSelectionQuery,
    volume: outputVolume,
  });

  useOverlayControls({
    equalizerPresetMenuRef,
    isEqualizerPresetMenuOpen,
    isLibrarySortMenuOpen,
    librarySortMenuRef,
    setDragOverPlaylistTrackIndex,
    setDraggedPlaylistTrackIndex,
    setIsEqualizerPresetMenuOpen,
    setIsLibrarySortMenuOpen,
  });

  useDiscordPresence({
    activeDuration,
    appLanguage,
    audioRef,
    getItunesCover,
    isPlaying,
    selectedTrackArtist,
    selectedTrackTitle,
    setStatusMessage,
  });
}
