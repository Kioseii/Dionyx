import { Compass, ListMusic } from "lucide-react";
import type { SavedPlaylist } from "../../app/types";

type SidebarCopy = {
  home: string;
  discoverNav: string;
  newPlaylist: string;
  playlists: string;
  noPlaylists: string;
  noPlaylistsHint: string;
  playlistOptions: string;
  playShuffled: string;
  renamePlaylist: string;
  editPlaylist: string;
  deletePlaylist: string;
};

type SidebarProps = {
  activePlaylistId: string | null;
  brandName: string;
  copy: SidebarCopy;
  isDiscoverView: boolean;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: string) => void;
  onOpenDiscover: () => void;
  onOpenLibrary: () => void;
  onOpenPlaylistEditor: (playlistId: string) => void;
  onOpenPlaylistRename: (playlistId: string) => void;
  onPlayPlaylistShuffled: (playlistId: string) => void;
  onPlaylistMenuToggle: (playlistId: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  openPlaylistMenuId: string | null;
  savedPlaylists: SavedPlaylist[];
  sidebarOpen: boolean;
  logoMarkup: string;
};

export function Sidebar({
  activePlaylistId,
  brandName,
  copy,
  isDiscoverView,
  onCreatePlaylist,
  onDeletePlaylist,
  onOpenDiscover,
  onOpenLibrary,
  onOpenPlaylistEditor,
  onOpenPlaylistRename,
  onPlayPlaylistShuffled,
  onPlaylistMenuToggle,
  onSelectPlaylist,
  openPlaylistMenuId,
  savedPlaylists,
  sidebarOpen,
  logoMarkup,
}: SidebarProps) {
  return (
    <aside
      className={`sidebar${sidebarOpen ? "" : " sidebar--collapsed"}`}
      onMouseEnter={(e) => e.currentTarget.classList.add("scrollbar-visible")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("scrollbar-visible")}
    >
      <div className="brand-block">
        <span className="brand-logo" dangerouslySetInnerHTML={{ __html: logoMarkup }} />
        <h1>{brandName}</h1>
      </div>

      <nav className="nav-list" aria-label="Primary">
        <button
          className={`nav-item ${!isDiscoverView && !activePlaylistId ? "active" : ""}`}
          onClick={onOpenLibrary}
          type="button"
        >
          <ListMusic aria-hidden="true" size={14} strokeWidth={2} style={{ marginRight: 4 }} />
          <span>{copy.home}</span>
        </button>
        <button
          className={`nav-item ${isDiscoverView ? "active" : ""}`}
          onClick={onOpenDiscover}
          type="button"
        >
          <Compass aria-hidden="true" size={14} strokeWidth={2} style={{ marginRight: 4 }} />
          <span>{copy.discoverNav}</span>
        </button>
      </nav>

      <button
        className="playlist-button"
        onClick={onCreatePlaylist}
        type="button"
      >
        {copy.newPlaylist}
      </button>

      <section className="playlist-section">
        <p className="sidebar-label">{copy.playlists}</p>
        <div className="playlist-list">
          {savedPlaylists.map((playlist) => (
            <div className="playlist-options-shell" key={playlist.id}>
              <button
                className={`playlist-item ${activePlaylistId === playlist.id ? "selected" : ""}`}
                onClick={() => {
                  onSelectPlaylist(playlist.id);
                }}
                type="button"
              >
                <span>{playlist.name}</span>
                <span className="playlist-play">{playlist.tracks.length}</span>
              </button>
              <button
                aria-label={`${copy.playlistOptions} ${playlist.name}`}
                className="playlist-options-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPlaylistMenuToggle(playlist.id);
                }}
                type="button"
              >
                <span />
                <span />
                <span />
              </button>
              {openPlaylistMenuId === playlist.id ? (
                <div className="playlist-options-menu">
                  <button
                    className="playlist-menu-item"
                    onClick={() => {
                      onPlayPlaylistShuffled(playlist.id);
                    }}
                    type="button"
                  >
                    {copy.playShuffled}
                  </button>
                  <button
                    className="playlist-menu-item"
                    onClick={() => {
                      onOpenPlaylistRename(playlist.id);
                    }}
                    type="button"
                  >
                    {copy.renamePlaylist}
                  </button>
                  <button
                    className="playlist-menu-item"
                    onClick={() => {
                      onOpenPlaylistEditor(playlist.id);
                    }}
                    type="button"
                  >
                    {copy.editPlaylist}
                  </button>
                  <button
                    className="playlist-menu-item danger"
                    onClick={() => {
                      onDeletePlaylist(playlist.id);
                    }}
                    type="button"
                  >
                    {copy.deletePlaylist}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {savedPlaylists.length === 0 ? (
            <div className="playlist-empty">
              <strong>{copy.noPlaylists}</strong>
              <p className="muted">{copy.noPlaylistsHint}</p>
            </div>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
