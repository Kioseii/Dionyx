import { useEffect, useMemo, useState } from "react";
import { storageKeys } from "../app/constants";
import type { AppLanguage, LibraryTrack, SavedPlaylist } from "../app/types";
import {
  getTrackKey,
  mergeUniqueTracks,
  parseStoredPlaylists,
  sanitizePlainTextInput,
  writeStoredValue,
} from "../app/utils";

type UsePlaylistsOptions = {
  appLanguage: AppLanguage;
  collectionName: string;
  scannedPath: string | null;
  setStatusMessage: (value: string) => void;
  tracks: LibraryTrack[];
};

export function usePlaylists({
  appLanguage,
  collectionName,
  scannedPath,
  setStatusMessage,
  tracks,
}: UsePlaylistsOptions) {
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() =>
    parseStoredPlaylists(readLocalPlaylists()),
  );
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playbackPlaylistId, setPlaybackPlaylistId] = useState<string | null>(null);
  const [draggedPlaylistTrackIndex, setDraggedPlaylistTrackIndex] = useState<number | null>(null);
  const [dragOverPlaylistTrackIndex, setDragOverPlaylistTrackIndex] = useState<number | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState<"create" | "edit">("create");
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [playlistDraftName, setPlaylistDraftName] = useState("");
  const [playlistSelectionQuery, setPlaylistSelectionQuery] = useState("");
  const [selectedPlaylistTrackKeys, setSelectedPlaylistTrackKeys] = useState<string[]>([]);
  const [openPlaylistMenuId, setOpenPlaylistMenuId] = useState<string | null>(null);
  const [isRenamePlaylistModalOpen, setIsRenamePlaylistModalOpen] = useState(false);
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<string | null>(null);
  const [renamePlaylistDraft, setRenamePlaylistDraft] = useState("");
  const [isTrackPlaylistModalOpen, setIsTrackPlaylistModalOpen] = useState(false);
  const [trackPlaylistTarget, setTrackPlaylistTarget] = useState<LibraryTrack | null>(null);
  const [quickPlaylistDraftName, setQuickPlaylistDraftName] = useState("");

  const activePlaylist = useMemo(
    () => activePlaylistId !== null
      ? savedPlaylists.find((playlist) => playlist.id === activePlaylistId) ?? null
      : null,
    [activePlaylistId, savedPlaylists],
  );
  const playbackPlaylist = useMemo(
    () => playbackPlaylistId !== null
      ? savedPlaylists.find((playlist) => playlist.id === playbackPlaylistId) ?? null
      : null,
    [playbackPlaylistId, savedPlaylists],
  );
  const editingPlaylist = useMemo(
    () => editingPlaylistId !== null
      ? savedPlaylists.find((playlist) => playlist.id === editingPlaylistId) ?? null
      : null,
    [editingPlaylistId, savedPlaylists],
  );
  const sourceTracks = activePlaylist ? activePlaylist.tracks : tracks;
  const playbackTracks = playbackPlaylist ? playbackPlaylist.tracks : tracks;
  const playlistCandidateTracks = useMemo(
    () => mergeUniqueTracks([tracks, editingPlaylist ? editingPlaylist.tracks : []]),
    [editingPlaylist, tracks],
  );
  const normalizedPlaylistSelectionQuery = playlistSelectionQuery.trim().toLowerCase();
  const filteredPlaylistCandidateTracks = playlistCandidateTracks.filter((track) => {
    if (!normalizedPlaylistSelectionQuery) {
      return true;
    }

    return [track.title, track.artist, track.album, track.format]
      .join(" ")
      .toLowerCase()
      .includes(normalizedPlaylistSelectionQuery);
  });

  useEffect(() => {
    writeStoredValue(storageKeys.playlists, JSON.stringify(savedPlaylists));
  }, [savedPlaylists]);

  function activatePlaylist(playlistId: string) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);
    if (!playlist) {
      return;
    }

    setActivePlaylistId(playlist.id);
    setStatusMessage(
      appLanguage === "es"
        ? `Playlist abierta: ${playlist.name}.`
        : `Playlist opened: ${playlist.name}.`,
    );
  }

  function createPlaylistFromCurrentSource() {
    const suggestedName = activePlaylist?.name ?? `Playlist ${savedPlaylists.length + 1}`;
    setPlaylistModalMode("create");
    setEditingPlaylistId(null);
    setPlaylistDraftName(sanitizePlainTextInput(suggestedName, 72).trim());
    setSelectedPlaylistTrackKeys([]);
    setIsPlaylistModalOpen(true);
  }

  function openTrackPlaylistModal(track: LibraryTrack) {
    if (!track.path && !track.source) {
      setStatusMessage(
        appLanguage === "es"
          ? "Primero carga o selecciona una cancion real para guardarla."
          : "Load or select a real song first before saving it.",
      );
      return;
    }

    const suggestedName = sanitizePlainTextInput(track.title, 72).trim() || `Playlist ${savedPlaylists.length + 1}`;
    setTrackPlaylistTarget(track);
    setQuickPlaylistDraftName(suggestedName);
    setIsTrackPlaylistModalOpen(true);
  }

  function closeTrackPlaylistModal() {
    setIsTrackPlaylistModalOpen(false);
    setTrackPlaylistTarget(null);
    setQuickPlaylistDraftName("");
  }

  function closePlaylistModal() {
    setIsPlaylistModalOpen(false);
    setPlaylistModalMode("create");
    setEditingPlaylistId(null);
    setPlaylistDraftName("");
    setSelectedPlaylistTrackKeys([]);
    setPlaylistSelectionQuery("");
  }

  function openPlaylistRenameModal(playlistId: string) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);
    if (!playlist) {
      return;
    }

    setRenamingPlaylistId(playlist.id);
    setRenamePlaylistDraft(playlist.name);
    setOpenPlaylistMenuId(null);
    setIsRenamePlaylistModalOpen(true);
  }

  function closePlaylistRenameModal() {
    setIsRenamePlaylistModalOpen(false);
    setRenamingPlaylistId(null);
    setRenamePlaylistDraft("");
  }

  function openPlaylistEditor(playlistId: string) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);
    if (!playlist) {
      return;
    }

    setPlaylistModalMode("edit");
    setEditingPlaylistId(playlist.id);
    setPlaylistDraftName(playlist.name);
    setSelectedPlaylistTrackKeys(playlist.tracks.map(getTrackKey));
    setOpenPlaylistMenuId(null);
    setIsPlaylistModalOpen(true);
  }

  function toggleTrackInPlaylistDraft(trackKey: string) {
    setSelectedPlaylistTrackKeys((previousKeys) =>
      previousKeys.includes(trackKey)
        ? previousKeys.filter((key) => key !== trackKey)
        : [...previousKeys, trackKey],
    );
  }

  function submitPlaylistCreation() {
    const playlistName = sanitizePlainTextInput(playlistDraftName, 72).trim();

    if (!playlistName) {
      setStatusMessage(
        appLanguage === "es"
          ? "Ponle un nombre a la playlist para guardarla."
          : "Give the playlist a name before saving it.",
      );
      return;
    }

    const selectedTrackKeySet = new Set(selectedPlaylistTrackKeys);
    const playlistTracks = playlistCandidateTracks
      .filter((track) => selectedTrackKeySet.has(getTrackKey(track)))
      .map((track) => ({ ...track }));

    const nextPlaylistId =
      editingPlaylist?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextPlaylist: SavedPlaylist = {
      id: nextPlaylistId,
      name: playlistName,
      sourceCollectionName: editingPlaylist?.sourceCollectionName ?? collectionName,
      sourcePath: editingPlaylist?.sourcePath ?? scannedPath,
      createdAt: editingPlaylist?.createdAt ?? Date.now(),
      tracks: playlistTracks,
    };

    setSavedPlaylists((previousPlaylists) => {
      if (playlistModalMode === "edit" && editingPlaylist) {
        return previousPlaylists.map((playlist) =>
          playlist.id === editingPlaylist.id ? nextPlaylist : playlist,
        );
      }

      return [nextPlaylist, ...previousPlaylists];
    });

    setActivePlaylistId(nextPlaylist.id);
    closePlaylistModal();
    setStatusMessage(
      playlistModalMode === "edit"
        ? appLanguage === "es"
          ? `Playlist actualizada: ${playlistName}.`
          : `Playlist updated: ${playlistName}.`
        : appLanguage === "es"
          ? `Playlist creada: ${playlistName}.`
          : `Playlist created: ${playlistName}.`,
    );
  }

  function playlistHasTrack(playlist: SavedPlaylist, track: LibraryTrack) {
    const trackKey = getTrackKey(track);
    return playlist.tracks.some((playlistTrack) => getTrackKey(playlistTrack) === trackKey);
  }

  function addTrackToPlaylist(playlistId: string, track: LibraryTrack) {
    const playlist = savedPlaylists.find((item) => item.id === playlistId);
    if (!playlist) {
      return;
    }

    if (playlistHasTrack(playlist, track)) {
      setStatusMessage(
        appLanguage === "es"
          ? `"${track.title}" ya estaba en ${playlist.name}.`
          : `"${track.title}" was already in ${playlist.name}.`,
      );
      return;
    }

    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.map((item) =>
        item.id === playlistId
          ? { ...item, tracks: [...item.tracks, { ...track }] }
          : item,
      ),
    );

    setStatusMessage(
      appLanguage === "es"
        ? `"${track.title}" se agrego a ${playlist.name}.`
        : `"${track.title}" was added to ${playlist.name}.`,
    );
  }

  function createPlaylistWithTrack(track: LibraryTrack) {
    const playlistName = sanitizePlainTextInput(quickPlaylistDraftName, 72).trim();

    if (!playlistName) {
      setStatusMessage(
        appLanguage === "es"
          ? "Ponle un nombre a la playlist antes de crearla."
          : "Give the playlist a name before creating it.",
      );
      return;
    }

    const nextPlaylist: SavedPlaylist = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: playlistName,
      sourceCollectionName: collectionName,
      sourcePath: scannedPath,
      createdAt: Date.now(),
      tracks: [{ ...track }],
    };

    setSavedPlaylists((previousPlaylists) => [nextPlaylist, ...previousPlaylists]);
    closeTrackPlaylistModal();
    setStatusMessage(
      appLanguage === "es"
        ? `Playlist creada con "${track.title}": ${playlistName}.`
        : `Playlist created with "${track.title}": ${playlistName}.`,
    );
  }

  function renamePlaylist() {
    const playlistName = sanitizePlainTextInput(renamePlaylistDraft, 72).trim();
    const playlist = savedPlaylists.find((item) => item.id === renamingPlaylistId);

    if (!playlist || !renamingPlaylistId) {
      closePlaylistRenameModal();
      return;
    }

    if (!playlistName) {
      setStatusMessage(
        appLanguage === "es"
          ? "Ponle un nombre valido a la playlist."
          : "Give the playlist a valid name.",
      );
      return;
    }

    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.map((item) =>
        item.id === renamingPlaylistId ? { ...item, name: playlistName } : item,
      ),
    );

    closePlaylistRenameModal();
    setStatusMessage(
      appLanguage === "es"
        ? `Playlist renombrada: ${playlistName}.`
        : `Playlist renamed: ${playlistName}.`,
    );
  }

  function handlePlaylistTrackDragStart(index: number) {
    if (!activePlaylist) {
      return;
    }

    setDraggedPlaylistTrackIndex(index);
    setDragOverPlaylistTrackIndex(index);
  }

  function handlePlaylistTrackDrop(targetIndex: number) {
    if (!activePlaylist || draggedPlaylistTrackIndex === null || targetIndex < 0) {
      return;
    }
  }

  return {
    activatePlaylist,
    activePlaylist,
    activePlaylistId,
    addTrackToPlaylist,
    closePlaylistModal,
    closePlaylistRenameModal,
    closeTrackPlaylistModal,
    createPlaylistFromCurrentSource,
    createPlaylistWithTrack,
    draggedPlaylistTrackIndex,
    dragOverPlaylistTrackIndex,
    editingPlaylist,
    filteredPlaylistCandidateTracks,
    handlePlaylistTrackDragStart,
    handlePlaylistTrackDrop,
    isPlaylistModalOpen,
    isRenamePlaylistModalOpen,
    isTrackPlaylistModalOpen,
    openPlaylistEditor,
    openPlaylistMenuId,
    openPlaylistRenameModal,
    openTrackPlaylistModal,
    playbackPlaylist,
    playbackPlaylistId,
    playbackTracks,
    playlistDraftName,
    playlistHasTrack,
    playlistModalMode,
    playlistSelectionQuery,
    quickPlaylistDraftName,
    renamePlaylist,
    renamePlaylistDraft,
    savedPlaylists,
    selectedPlaylistTrackKeys,
    setActivePlaylistId,
    setDraggedPlaylistTrackIndex,
    setDragOverPlaylistTrackIndex,
    setOpenPlaylistMenuId,
    setPlaybackPlaylistId,
    setPlaylistDraftName,
    setPlaylistSelectionQuery,
    setQuickPlaylistDraftName,
    setRenamePlaylistDraft,
    setSavedPlaylists,
    sourceTracks,
    submitPlaylistCreation,
    toggleTrackInPlaylistDraft,
    trackPlaylistTarget,
  };
}

function readLocalPlaylists() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKeys.playlists);
  } catch {
    return null;
  }
}
