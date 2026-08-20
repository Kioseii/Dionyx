import type { LibraryTrack } from "../app/types";
import { sanitizePlainTextInput } from "../app/utils";

type UsePlaylistModalHandlersOptions = {
  addTrackToPlaylist: (playlistId: string, track: LibraryTrack) => void;
  createPlaylistWithTrack: (track: LibraryTrack) => void;
  setPlaylistDraftName: (value: string) => void;
  setPlaylistSelectionQuery: (value: string) => void;
  setQuickPlaylistDraftName: (value: string) => void;
  setRenamePlaylistDraft: (value: string) => void;
  trackPlaylistTarget: LibraryTrack | null;
};

export function usePlaylistModalHandlers({
  addTrackToPlaylist,
  createPlaylistWithTrack,
  setPlaylistDraftName,
  setPlaylistSelectionQuery,
  setQuickPlaylistDraftName,
  setRenamePlaylistDraft,
  trackPlaylistTarget,
}: UsePlaylistModalHandlersOptions) {
  function handlePlaylistDraftNameChange(value: string) {
    setPlaylistDraftName(sanitizePlainTextInput(value, 72));
  }

  function handlePlaylistSelectionQueryChange(value: string) {
    setPlaylistSelectionQuery(sanitizePlainTextInput(value, 120));
  }

  function handleQuickPlaylistDraftNameChange(value: string) {
    setQuickPlaylistDraftName(sanitizePlainTextInput(value, 72));
  }

  function handleRenamePlaylistDraftChange(value: string) {
    setRenamePlaylistDraft(sanitizePlainTextInput(value, 72));
  }

  function handleAddTrackToPlaylist(playlistId: string) {
    if (trackPlaylistTarget) {
      addTrackToPlaylist(playlistId, trackPlaylistTarget);
    }
  }

  function handleCreatePlaylistWithTrack() {
    if (trackPlaylistTarget) {
      createPlaylistWithTrack(trackPlaylistTarget);
    }
  }

  return {
    handleAddTrackToPlaylist,
    handleCreatePlaylistWithTrack,
    handlePlaylistDraftNameChange,
    handlePlaylistSelectionQueryChange,
    handleQuickPlaylistDraftNameChange,
    handleRenamePlaylistDraftChange,
  };
}
