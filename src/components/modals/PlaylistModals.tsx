import type { LibraryTrack, SavedPlaylist } from "../../app/types";

type PlaylistCopy = {
  editPlaylist: string;
  newPlaylistTitle: string;
  chooseSongsToKeep: string;
  createEmptyPlaylist: string;
  markTracks: string;
  name: string;
  searchSongsToAdd: string;
  searchTracksPlaceholder: string;
  noSongsToShow: string;
  noSongsToShowBody: string;
  cancel: string;
  saveChanges: string;
  createPlaylist: string;
  saveSong: string;
  saveTrackToPlaylist: string;
  songsCount: string;
  alreadyThere: string;
  add: string;
  noPlaylistsYet: string;
  noPlaylistsYetBody: string;
  newPlaylistField: string;
  createAndSave: string;
  renamePlaylist: string;
  chooseNewName: string;
  saveName: string;
};

type PlaylistModalProps = {
  copy: PlaylistCopy;
  filteredPlaylistCandidateTracks: LibraryTrack[];
  getTrackKey: (track: LibraryTrack) => string;
  isOpen: boolean;
  onClose: () => void;
  onPlaylistDraftNameChange: (value: string) => void;
  onPlaylistSelectionQueryChange: (value: string) => void;
  onSubmit: () => void;
  onToggleTrack: (trackKey: string) => void;
  playlistDraftName: string;
  playlistModalMode: "create" | "edit";
  playlistSelectionQuery: string;
  selectedPlaylistTrackKeys: string[];
};

export function PlaylistModal({
  copy,
  filteredPlaylistCandidateTracks,
  getTrackKey,
  isOpen,
  onClose,
  onPlaylistDraftNameChange,
  onPlaylistSelectionQueryChange,
  onSubmit,
  onToggleTrack,
  playlistDraftName,
  playlistModalMode,
  playlistSelectionQuery,
  selectedPlaylistTrackKeys,
}: PlaylistModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="playlist-modal-title"
        aria-modal="true"
        className="modal-shell"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <p className="eyebrow">
          {playlistModalMode === "edit" ? copy.editPlaylist : copy.newPlaylistTitle}
        </p>
        <h3 id="playlist-modal-title">
          {playlistModalMode === "edit"
            ? copy.chooseSongsToKeep
            : copy.createEmptyPlaylist}
        </h3>
        <p className="muted modal-copy">{copy.markTracks}</p>
        <label className="modal-field" htmlFor="playlist-name-input">
          <span>{copy.name}</span>
          <input
            autoFocus
            className="modal-input"
            id="playlist-name-input"
            onChange={(event) => {
              onPlaylistDraftNameChange(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            type="text"
            value={playlistDraftName}
          />
        </label>
        <label className="modal-field" htmlFor="playlist-track-search">
          <span>{copy.searchSongsToAdd}</span>
          <input
            className="modal-input"
            id="playlist-track-search"
            onChange={(event) => {
              onPlaylistSelectionQueryChange(event.currentTarget.value);
            }}
            placeholder={copy.searchTracksPlaceholder}
            type="search"
            value={playlistSelectionQuery}
          />
        </label>
        <div className="playlist-picker-list">
          {filteredPlaylistCandidateTracks.length > 0 ? (
            filteredPlaylistCandidateTracks.map((track) => {
              const trackKey = getTrackKey(track);
              const isSelected = selectedPlaylistTrackKeys.includes(trackKey);

              return (
                <label className={`playlist-picker-item ${isSelected ? "selected" : ""}`} key={trackKey}>
                  <input
                    checked={isSelected}
                    onChange={() => {
                      onToggleTrack(trackKey);
                    }}
                    type="checkbox"
                  />
                  <div>
                    <strong>{track.title}</strong>
                    <p className="muted">
                      {track.artist} • {track.album} • {track.duration}
                    </p>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="playlist-picker-empty">
              <strong>{copy.noSongsToShow}</strong>
              <p className="muted">{copy.noSongsToShowBody}</p>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="mini-button" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          <button className="mini-button active" onClick={onSubmit} type="button">
            {playlistModalMode === "edit" ? copy.saveChanges : copy.createPlaylist}
          </button>
        </div>
      </div>
    </div>
  );
}

type TrackPlaylistModalProps = {
  copy: PlaylistCopy;
  isOpen: boolean;
  onAddTrackToPlaylist: (playlistId: string) => void;
  onClose: () => void;
  onCreateAndSave: () => void;
  onQuickPlaylistDraftNameChange: (value: string) => void;
  quickPlaylistDraftName: string;
  savedPlaylists: SavedPlaylist[];
  targetTrack: LibraryTrack | null;
  trackAlreadyInPlaylist: (playlist: SavedPlaylist, track: LibraryTrack) => boolean;
};

export function TrackPlaylistModal({
  copy,
  isOpen,
  onAddTrackToPlaylist,
  onClose,
  onCreateAndSave,
  onQuickPlaylistDraftNameChange,
  quickPlaylistDraftName,
  savedPlaylists,
  targetTrack,
  trackAlreadyInPlaylist,
}: TrackPlaylistModalProps) {
  if (!isOpen || !targetTrack) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="track-playlist-modal-title"
        aria-modal="true"
        className="modal-shell quick-save-modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <p className="eyebrow">{copy.saveSong}</p>
        <h3 id="track-playlist-modal-title">{copy.saveTrackToPlaylist}</h3>
        <p className="muted modal-copy">
          {targetTrack.title} • {targetTrack.artist}
        </p>

        <div className="playlist-target-list">
          {savedPlaylists.length > 0 ? (
            savedPlaylists.map((playlist) => {
              const alreadyIncluded = trackAlreadyInPlaylist(playlist, targetTrack);

              return (
                <div className="playlist-target-item" key={playlist.id}>
                  <div>
                    <strong>{playlist.name}</strong>
                    <p className="muted">{playlist.tracks.length} {copy.songsCount}</p>
                  </div>
                  <button
                    className={`mini-button ${alreadyIncluded ? "" : "active"}`}
                    disabled={alreadyIncluded}
                    onClick={() => {
                      onAddTrackToPlaylist(playlist.id);
                    }}
                    type="button"
                  >
                    {alreadyIncluded ? copy.alreadyThere : copy.add}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="playlist-picker-empty">
              <strong>{copy.noPlaylistsYet}</strong>
              <p className="muted">{copy.noPlaylistsYetBody}</p>
            </div>
          )}
        </div>

        <label className="modal-field" htmlFor="quick-playlist-name-input">
          <span>{copy.newPlaylistField}</span>
          <input
            className="modal-input"
            id="quick-playlist-name-input"
            onChange={(event) => {
              onQuickPlaylistDraftNameChange(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onCreateAndSave();
              }
            }}
            type="text"
            value={quickPlaylistDraftName}
          />
        </label>

        <div className="modal-actions">
          <button className="mini-button" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          <button
            className="mini-button active"
            onClick={onCreateAndSave}
            type="button"
          >
            {copy.createAndSave}
          </button>
        </div>
      </div>
    </div>
  );
}

type RenamePlaylistModalProps = {
  copy: PlaylistCopy;
  isOpen: boolean;
  onClose: () => void;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  renamePlaylistDraft: string;
};

export function RenamePlaylistModal({
  copy,
  isOpen,
  onClose,
  onDraftChange,
  onSubmit,
  renamePlaylistDraft,
}: RenamePlaylistModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        aria-labelledby="rename-playlist-modal-title"
        aria-modal="true"
        className="modal-shell quick-save-modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <p className="eyebrow">{copy.renamePlaylist}</p>
        <h3 id="rename-playlist-modal-title">{copy.chooseNewName}</h3>
        <label className="modal-field" htmlFor="rename-playlist-input">
          <span>{copy.name}</span>
          <input
            autoFocus
            className="modal-input"
            id="rename-playlist-input"
            onChange={(event) => {
              onDraftChange(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            type="text"
            value={renamePlaylistDraft}
          />
        </label>
        <div className="modal-actions">
          <button className="mini-button" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          <button className="mini-button active" onClick={onSubmit} type="button">
            {copy.saveName}
          </button>
        </div>
      </div>
    </div>
  );
}
