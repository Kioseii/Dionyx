import { invoke } from "@tauri-apps/api/core";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import type { LibraryTrack, SavedPlaylist } from "../app/types";
import { getTrackKey } from "../app/utils";

type TrackManagementCopy = {
  editMetaArtworkSizeError: string;
  editMetaSaveError: string;
  editMetaSaveSuccess: string;
  trackDeleteError: string;
  trackDeleteSuccess: string;
  trackMenuDeleteConfirm: string;
};

type UseTrackManagementOptions = {
  copy: TrackManagementCopy;
  currentTrackIndex: number;
  savedPlaylists: SavedPlaylist[];
  setCurrentTrackIndex: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  setSavedPlaylists: (
    value: SavedPlaylist[] | ((previousPlaylists: SavedPlaylist[]) => SavedPlaylist[]),
  ) => void;
  setStatusMessage: (value: string) => void;
  setTracks: (
    value: LibraryTrack[] | ((previousTracks: LibraryTrack[]) => LibraryTrack[]),
  ) => void;
  tracks: LibraryTrack[];
};

const ARTWORK_MAX_BYTES = 2 * 1024 * 1024;

export function useTrackManagement({
  copy,
  currentTrackIndex,
  savedPlaylists,
  setCurrentTrackIndex,
  setIsPlaying,
  setSavedPlaylists,
  setStatusMessage,
  setTracks,
  tracks,
}: UseTrackManagementOptions) {
  const [openTrackMenuIndex, setOpenTrackMenuIndex] = useState<number | null>(null);
  const trackMenuRef = useRef<HTMLDivElement | null>(null);
  const [isEditMetaModalOpen, setIsEditMetaModalOpen] = useState(false);
  const [editMetaTrack, setEditMetaTrack] = useState<LibraryTrack | null>(null);
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaArtist, setEditMetaArtist] = useState("");
  const [editMetaAlbum, setEditMetaAlbum] = useState("");
  const [editMetaArtworkPreview, setEditMetaArtworkPreview] = useState<string | null>(null);
  const [editMetaArtworkB64, setEditMetaArtworkB64] = useState<string | null>(null);
  const [editMetaArtworkMime, setEditMetaArtworkMime] = useState<string | null>(null);
  const [editMetaArtworkError, setEditMetaArtworkError] = useState<string | null>(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const editMetaArtworkInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (openTrackMenuIndex === null) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (trackMenuRef.current && !trackMenuRef.current.contains(event.target as Node)) {
        setOpenTrackMenuIndex(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenTrackMenuIndex(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openTrackMenuIndex]);

  async function handleDeleteTrack(track: LibraryTrack) {
    setOpenTrackMenuIndex(null);

    if (!window.confirm(copy.trackMenuDeleteConfirm)) {
      return;
    }

    try {
      await invoke("delete_track_file", { path: track.path });

      const trackKey = getTrackKey(track);
      const nextTracks = tracks.filter((currentTrack) => getTrackKey(currentTrack) !== trackKey);
      const nextPlaylists = savedPlaylists.map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.filter((currentTrack) => getTrackKey(currentTrack) !== trackKey),
      }));

      const deletedOriginalIndex = tracks.findIndex(
        (currentTrack) => getTrackKey(currentTrack) === trackKey,
      );
      let nextTrackIndex = currentTrackIndex;

      if (deletedOriginalIndex >= 0) {
        if (currentTrackIndex > deletedOriginalIndex) {
          nextTrackIndex = currentTrackIndex - 1;
        } else if (currentTrackIndex === deletedOriginalIndex) {
          nextTrackIndex = Math.min(currentTrackIndex, nextTracks.length - 1);
          setIsPlaying(false);
        }
      }

      setTracks(nextTracks);
      setSavedPlaylists(nextPlaylists);
      setCurrentTrackIndex(Math.max(0, nextTrackIndex));
      setStatusMessage(copy.trackDeleteSuccess);
    } catch {
      setStatusMessage(copy.trackDeleteError);
    }
  }

  function openEditMetaModal(track: LibraryTrack) {
    setOpenTrackMenuIndex(null);
    setEditMetaTrack(track);
    setEditMetaTitle(track.title);
    setEditMetaArtist(track.artist);
    setEditMetaAlbum(track.album);
    setEditMetaArtworkPreview(track.artworkDataUrl ?? null);
    setEditMetaArtworkB64(null);
    setEditMetaArtworkMime(null);
    setEditMetaArtworkError(null);
    setIsSavingMeta(false);
    setIsEditMetaModalOpen(true);
  }

  function closeEditMetaModal() {
    setIsEditMetaModalOpen(false);
    setEditMetaTrack(null);
  }

  function handleArtworkFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > ARTWORK_MAX_BYTES) {
      setEditMetaArtworkError(copy.editMetaArtworkSizeError);
      event.target.value = "";
      return;
    }

    setEditMetaArtworkError(null);
    const mime = file.type || "image/jpeg";
    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setEditMetaArtworkPreview(dataUrl);
      setEditMetaArtworkB64(base64);
      setEditMetaArtworkMime(mime);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSaveMetadata() {
    if (!editMetaTrack) {
      return;
    }

    setIsSavingMeta(true);

    try {
      await invoke("save_track_metadata", {
        path: editMetaTrack.path,
        title: editMetaTitle.trim(),
        artist: editMetaArtist.trim(),
        album: editMetaAlbum.trim(),
        artworkB64: editMetaArtworkB64 ?? undefined,
        artworkMime: editMetaArtworkMime ?? undefined,
      });

      const updatedTrack: LibraryTrack = {
        ...editMetaTrack,
        title: editMetaTitle.trim() || editMetaTrack.title,
        artist: editMetaArtist.trim() || editMetaTrack.artist,
        album: editMetaAlbum.trim() || editMetaTrack.album,
        artworkDataUrl: editMetaArtworkPreview ?? editMetaTrack.artworkDataUrl,
      };

      const trackKey = getTrackKey(editMetaTrack);

      setTracks((previousTracks) =>
        previousTracks.map((track) =>
          getTrackKey(track) === trackKey ? updatedTrack : track,
        ),
      );
      setSavedPlaylists((previousPlaylists) =>
        previousPlaylists.map((playlist) => ({
          ...playlist,
          tracks: playlist.tracks.map((track) =>
            getTrackKey(track) === trackKey ? updatedTrack : track,
          ),
        })),
      );

      setStatusMessage(copy.editMetaSaveSuccess);
      closeEditMetaModal();
    } catch {
      setStatusMessage(copy.editMetaSaveError);
    } finally {
      setIsSavingMeta(false);
    }
  }

  return {
    closeEditMetaModal,
    editMetaAlbum,
    editMetaArtist,
    editMetaArtworkError,
    editMetaArtworkInputRef,
    editMetaArtworkPreview,
    editMetaTitle,
    handleArtworkFileChange,
    handleDeleteTrack,
    handleSaveMetadata,
    isEditMetaModalOpen,
    isSavingMeta,
    openEditMetaModal,
    openTrackMenuIndex,
    setEditMetaAlbum,
    setEditMetaArtist,
    setEditMetaTitle,
    setOpenTrackMenuIndex,
    trackMenuRef,
    trackToEdit: editMetaTrack,
  };
}
