import type { MutableRefObject, RefObject } from "react";
import type { AppLanguage, LibrarySortKey, LibraryTrack } from "../app/types";
import { useLibraryActions } from "./use-library-actions";
import { useLibraryViewModel } from "./use-library-view-model";
import { usePlaybackNavigation } from "./use-playback-navigation";
import { usePlaylistPlayback } from "./use-playlist-playback";
import { usePlaylists } from "./use-playlists";
import { useStableTrackSelection } from "./use-stable-track-selection";

type UsePlaylistLibraryStackOptions = {
  activeDuration: number;
  appLanguage: AppLanguage;
  audioPreloadRef: RefObject<HTMLAudioElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  collectionName: string;
  currentTrackIndex: number;
  currentTrackIndexSetExplicitlyRef: MutableRefObject<boolean>;
  displayTrackIndicesRef: MutableRefObject<number[]>;
  handleSeek: (value: number) => void;
  ignoreNextRowClickRef: MutableRefObject<boolean>;
  isTransitioningTrackRef: MutableRefObject<boolean>;
  librarySortKey: LibrarySortKey;
  playbackTime: number;
  scannedPath: string | null;
  searchQuery: string;
  setActiveDuration: (value: number) => void;
  setCurrentTrackIndex: (value: number | ((current: number) => number)) => void;
  setIsDiscoverView: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackTime: (value: number) => void;
  setStatusMessage: (value: string) => void;
  syncCurrentTrackIndex: (value: number) => void;
  tracks: LibraryTrack[];
};

export function usePlaylistLibraryStack({
  activeDuration,
  appLanguage,
  audioPreloadRef,
  audioRef,
  collectionName,
  currentTrackIndex: storedTrackIndex,
  currentTrackIndexSetExplicitlyRef,
  displayTrackIndicesRef,
  handleSeek,
  ignoreNextRowClickRef,
  isTransitioningTrackRef,
  librarySortKey,
  playbackTime,
  scannedPath,
  searchQuery,
  setActiveDuration,
  setCurrentTrackIndex,
  setIsDiscoverView,
  setIsPlaying,
  setPlaybackTime,
  setStatusMessage,
  syncCurrentTrackIndex,
  tracks,
}: UsePlaylistLibraryStackOptions) {
  const playlists = usePlaylists({
    appLanguage,
    collectionName,
    scannedPath,
    setStatusMessage,
    tracks,
  });

  // Everything below works with the index of the track that is actually
  // current, even in the render where the list changed under it.
  const currentTrackIndex = useStableTrackSelection({
    currentTrackIndex: storedTrackIndex,
    indexSetExplicitlyRef: currentTrackIndexSetExplicitlyRef,
    playbackTracks: playlists.playbackTracks,
    syncCurrentTrackIndex,
  });

  const playbackNavigation = usePlaybackNavigation({
    activePlaylistId: playlists.activePlaylistId,
    activeDuration,
    audioPreloadRef,
    audioRef,
    currentTrackIndex,
    displayTrackIndicesRef,
    handleSeek,
    isTransitioningTrackRef,
    librarySortKey,
    playbackPlaylistId: playlists.playbackPlaylistId,
    playbackTime,
    playbackTracks: playlists.playbackTracks,
    setActiveDuration,
    setCurrentTrackIndex,
    setIsPlaying,
    setPlaybackPlaylistId: playlists.setPlaybackPlaylistId,
    setPlaybackTime,
  });

  const libraryViewModel = useLibraryViewModel({
    activePlaylist: playlists.activePlaylist,
    appLanguage,
    currentTrackIndex,
    displayTrackIndicesRef,
    librarySortKey,
    playbackQueue: playbackNavigation.playbackQueue,
    playbackTracks: playlists.playbackTracks,
    searchQuery,
    sourceTracks: playlists.sourceTracks,
  });

  const playlistPlayback = usePlaylistPlayback({
    activePlaylist: playlists.activePlaylist,
    activePlaylistId: playlists.activePlaylistId,
    appLanguage,
    currentTrackIndex,
    draggedPlaylistTrackIndex: playlists.draggedPlaylistTrackIndex,
    playbackPlaylistId: playlists.playbackPlaylistId,
    savedPlaylists: playlists.savedPlaylists,
    selectedTrack: libraryViewModel.selectedTrack,
    selectedTrackInViewIndex: libraryViewModel.selectedTrackInViewIndex,
    selectedTrackKey: libraryViewModel.selectedTrackKey,
    setActiveDuration,
    setActivePlaylistId: playlists.setActivePlaylistId,
    setCurrentTrackIndex,
    setDragOverPlaylistTrackIndex: playlists.setDragOverPlaylistTrackIndex,
    setDraggedPlaylistTrackIndex: playlists.setDraggedPlaylistTrackIndex,
    setIsPlaying,
    setOpenPlaylistMenuId: playlists.setOpenPlaylistMenuId,
    setPlaybackPlaylistId: playlists.setPlaybackPlaylistId,
    setPlaybackTime,
    setSavedPlaylists: playlists.setSavedPlaylists,
    setShuffleEnabled: playbackNavigation.setShuffleEnabled,
    setStatusMessage,
    tracks,
  });

  const libraryActions = useLibraryActions({
    appLanguage,
    handlePlaylistTrackDropBase: playlistPlayback.handlePlaylistTrackDrop,
    ignoreNextRowClickRef,
    setActivePlaylistId: playlists.setActivePlaylistId,
    setIsDiscoverView,
    setOpenPlaylistMenuId: playlists.setOpenPlaylistMenuId,
    setStatusMessage,
  });

  return {
    currentTrackIndex,
    ...playlists,
    ...playbackNavigation,
    ...libraryViewModel,
    ...playlistPlayback,
    ...libraryActions,
  };
}
