import type { RefObject } from "react";
import type { LibraryTrack, SavedPlaylist } from "../app/types";
import { useAppShellEffects } from "./use-app-shell-effects";
import { useDiscordPresence } from "./use-discord-presence";
import { useOverlayControls } from "./use-overlay-controls";
import { usePersistenceSync } from "./use-persistence-sync";

type UseAppGlobalEffectsOptions = {
  activePlaylistOpen: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrackIndex: number;
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
  savedPlaylists: SavedPlaylist[];
  selectedEqualizerPresetId: string;
  selectedTrackArtist: string;
  selectedTrackTitle: string;
  setDragOverPlaylistTrackIndex: (value: number | null) => void;
  setDraggedPlaylistTrackIndex: (value: number | null) => void;
  setIsEqualizerPresetMenuOpen: (value: boolean) => void;
  setIsLibrarySortMenuOpen: (value: boolean) => void;
  setPlaylistSelectionQuery: (value: string) => void;
  tracks: LibraryTrack[];
  volume: number;
};

export function useAppGlobalEffects({
  activePlaylistOpen,
  audioRef,
  currentTrackIndex,
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
  savedPlaylists,
  selectedEqualizerPresetId,
  selectedTrackArtist,
  selectedTrackTitle,
  setDragOverPlaylistTrackIndex,
  setDraggedPlaylistTrackIndex,
  setIsEqualizerPresetMenuOpen,
  setIsLibrarySortMenuOpen,
  setPlaylistSelectionQuery,
  tracks,
  volume,
}: UseAppGlobalEffectsOptions) {
  usePersistenceSync({
    currentTrackIndex,
    equalizerValues,
    hideOnTray,
    isEqualizerEnabled,
    savedPlaylists,
    selectedEqualizerPresetId,
    tracks,
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
