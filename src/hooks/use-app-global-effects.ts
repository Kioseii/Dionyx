import type { RefObject } from "react";
import { useAppShellEffects } from "./use-app-shell-effects";
import { useDiscordPresence } from "./use-discord-presence";
import { useOverlayControls } from "./use-overlay-controls";
import { usePersistenceSync } from "./use-persistence-sync";

type UseAppGlobalEffectsOptions = {
  activePlaylistOpen: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  equalizerPresetMenuRef: RefObject<HTMLDivElement | null>;
  equalizerValues: number[];
  getItunesCover: (query: string, entity: "musicArtist" | "song") => Promise<string | null>;
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
  volume: number;
};

export function useAppGlobalEffects({
  activePlaylistOpen,
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
  volume,
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
    volume,
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
    audioRef,
    getItunesCover,
    isPlaying,
    selectedTrackArtist,
    selectedTrackTitle,
  });
}
