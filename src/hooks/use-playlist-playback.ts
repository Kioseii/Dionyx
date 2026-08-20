import { getTrackKey } from "../app/utils";
import type { AppLanguage, LibraryTrack, SavedPlaylist } from "../app/types";

type UsePlaylistPlaybackOptions = {
  activePlaylist: SavedPlaylist | null;
  activePlaylistId: string | null;
  appLanguage: AppLanguage;
  currentTrackIndex: number;
  draggedPlaylistTrackIndex: number | null;
  playbackPlaylistId: string | null;
  savedPlaylists: SavedPlaylist[];
  selectedTrack: LibraryTrack;
  selectedTrackInViewIndex: number;
  selectedTrackKey: string;
  setActiveDuration: (value: number) => void;
  setActivePlaylistId: (value: string | null) => void;
  setCurrentTrackIndex: (value: number | ((current: number) => number)) => void;
  setDragOverPlaylistTrackIndex: (value: number | null) => void;
  setDraggedPlaylistTrackIndex: (value: number | null) => void;
  setIsPlaying: (value: boolean) => void;
  setOpenPlaylistMenuId: (value: string | null) => void;
  setPlaybackPlaylistId: (value: string | null) => void;
  setPlaybackTime: (value: number) => void;
  setSavedPlaylists: (
    value:
      | SavedPlaylist[]
      | ((previousPlaylists: SavedPlaylist[]) => SavedPlaylist[]),
  ) => void;
  setShuffleEnabled: (value: boolean) => void;
  setStatusMessage: (value: string) => void;
  tracks: LibraryTrack[];
};

export function usePlaylistPlayback({
  activePlaylist,
  activePlaylistId,
  appLanguage,
  currentTrackIndex,
  draggedPlaylistTrackIndex,
  playbackPlaylistId,
  savedPlaylists,
  selectedTrack,
  selectedTrackInViewIndex,
  selectedTrackKey,
  setActiveDuration,
  setActivePlaylistId,
  setCurrentTrackIndex,
  setDragOverPlaylistTrackIndex,
  setDraggedPlaylistTrackIndex,
  setIsPlaying,
  setOpenPlaylistMenuId,
  setPlaybackPlaylistId,
  setPlaybackTime,
  setSavedPlaylists,
  setShuffleEnabled,
  setStatusMessage,
  tracks,
}: UsePlaylistPlaybackOptions) {
  function deletePlaylist(playlistId: string) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);

    if (!playlist) {
      return;
    }

    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.filter((item) => item.id !== playlistId),
    );

    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }

    if (playbackPlaylistId === playlistId) {
      const fallbackLibraryIndex = tracks.findIndex(
        (track) => getTrackKey(track) === selectedTrackKey,
      );

      if (fallbackLibraryIndex >= 0) {
        setPlaybackPlaylistId(null);
        setCurrentTrackIndex(fallbackLibraryIndex);
      } else {
        setPlaybackPlaylistId(null);
        setCurrentTrackIndex(0);
        setPlaybackTime(0);
        setActiveDuration(0);
        setIsPlaying(false);
      }
    }

    setOpenPlaylistMenuId(null);
    setStatusMessage(
      appLanguage === "es"
        ? `Playlist borrada: ${playlist.name}.`
        : `Playlist deleted: ${playlist.name}.`,
    );
  }

  function playPlaylistShuffled(playlistId: string) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);

    if (!playlist || playlist.tracks.length === 0) {
      setStatusMessage(
        appLanguage === "es"
          ? "Esa playlist esta vacia. Agregale canciones primero."
          : "That playlist is empty. Add songs first.",
      );
      setOpenPlaylistMenuId(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * playlist.tracks.length);

    setActivePlaylistId(playlist.id);
    setPlaybackPlaylistId(playlist.id);
    setShuffleEnabled(true);
    setCurrentTrackIndex(randomIndex);
    setPlaybackTime(0);
    setActiveDuration(0);
    setIsPlaying(true);
    setOpenPlaylistMenuId(null);
    setStatusMessage(
      appLanguage === "es"
        ? `Reproduccion aleatoria desde ${playlist.name}.`
        : `Shuffle playback from ${playlist.name}.`,
    );
  }

  function reorderActivePlaylistTrack(fromIndex: number, toIndex: number) {
    if (!activePlaylist || fromIndex === toIndex) {
      return;
    }

    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= activePlaylist.tracks.length ||
      toIndex >= activePlaylist.tracks.length
    ) {
      return;
    }

    const nextTracks = [...activePlaylist.tracks];
    const [movedTrack] = nextTracks.splice(fromIndex, 1);
    nextTracks.splice(toIndex, 0, movedTrack);
    const playbackTrackKey =
      playbackPlaylistId === activePlaylist.id ? getTrackKey(selectedTrack) : null;

    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.map((playlist) => {
        if (playlist.id !== activePlaylist.id) {
          return playlist;
        }

        return {
          ...playlist,
          tracks: nextTracks,
        };
      }),
    );

    if (playbackTrackKey) {
      const nextPlaybackIndex = nextTracks.findIndex(
        (track) => getTrackKey(track) === playbackTrackKey,
      );

      if (nextPlaybackIndex >= 0) {
        setCurrentTrackIndex(nextPlaybackIndex);
      }
    }

    setStatusMessage(
      appLanguage === "es"
        ? `"${movedTrack.title}" se movio dentro de ${activePlaylist.name}.`
        : `"${movedTrack.title}" was moved inside ${activePlaylist.name}.`,
    );
  }

  function removeTrackFromActivePlaylist() {
    if (
      !activePlaylist ||
      selectedTrackInViewIndex < 0 ||
      !activePlaylist.tracks[selectedTrackInViewIndex]
    ) {
      return;
    }

    const removedTrack = activePlaylist.tracks[selectedTrackInViewIndex];
    const nextTracksLength = activePlaylist.tracks.length - 1;

    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.map((playlist) =>
        playlist.id === activePlaylist.id
          ? {
              ...playlist,
              tracks: playlist.tracks.filter((_, index) => index !== selectedTrackInViewIndex),
            }
          : playlist,
      ),
    );

    if (playbackPlaylistId === activePlaylist.id && selectedTrackInViewIndex === currentTrackIndex) {
      const fallbackLibraryIndex = tracks.findIndex(
        (track) => getTrackKey(track) === getTrackKey(removedTrack),
      );

      if (fallbackLibraryIndex >= 0) {
        setPlaybackPlaylistId(null);
        setCurrentTrackIndex(fallbackLibraryIndex);
      } else if (nextTracksLength > 0) {
        setCurrentTrackIndex((previousIndex) => Math.min(previousIndex, nextTracksLength - 1));
      } else {
        setPlaybackPlaylistId(null);
        setCurrentTrackIndex(0);
        setPlaybackTime(0);
        setActiveDuration(0);
        setIsPlaying(false);
      }
    }

    setStatusMessage(
      appLanguage === "es"
        ? `"${removedTrack.title}" se quito de ${activePlaylist.name}.`
        : `"${removedTrack.title}" was removed from ${activePlaylist.name}.`,
    );
  }

  function handlePlaylistTrackDrop(targetIndex: number) {
    if (!activePlaylist || draggedPlaylistTrackIndex === null) {
      return;
    }

    reorderActivePlaylistTrack(draggedPlaylistTrackIndex, targetIndex);
    setDraggedPlaylistTrackIndex(null);
    setDragOverPlaylistTrackIndex(null);
  }

  return {
    deletePlaylist,
    handlePlaylistTrackDrop,
    playPlaylistShuffled,
    removeTrackFromActivePlaylist,
  };
}
