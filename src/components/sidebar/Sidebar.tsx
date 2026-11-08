import { Compass, Download, FolderOpen, ListMusic, Palette, Plus, RefreshCw, Settings } from "lucide-react";
import { countLabel } from "../../app/library-groups";
import { useShell } from "../layout/ShellContext";
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
  const shell = useShell();
  const libraryName = shell.scannedPath ? shell.collectionName : shell.copy.noLibraryFolder;

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
          aria-current={!isDiscoverView && !activePlaylistId ? "page" : undefined}
          className={`nav-item ${!isDiscoverView && !activePlaylistId ? "active" : ""}`}
          onClick={onOpenLibrary}
          type="button"
        >
          <ListMusic aria-hidden="true" className="nav-item-icon" size={18} strokeWidth={2} />
          <span>{copy.home}</span>
        </button>
        <button
          aria-current={isDiscoverView ? "page" : undefined}
          className={`nav-item ${isDiscoverView ? "active" : ""}`}
          onClick={onOpenDiscover}
          type="button"
        >
          <Compass aria-hidden="true" className="nav-item-icon" size={18} strokeWidth={2} />
          <span>{copy.discoverNav}</span>
        </button>
        <button className="nav-item" onClick={shell.onOpenDownloads} type="button">
          <Download aria-hidden="true" className="nav-item-icon" size={18} strokeWidth={2} />
          <span>{shell.copy.downloadsNav}</span>
          {shell.activeDownloadCount > 0 ? (
            <span className="nav-badge">{shell.activeDownloadCount}</span>
          ) : null}
        </button>
      </nav>

      <section className="playlist-section">
        <div className="sidebar-section-header">
          <p className="sidebar-label">{copy.playlists}</p>
          <button
            aria-label={copy.newPlaylist.replace(/^\+\s*/, "")}
            className="sidebar-icon-button"
            onClick={onCreatePlaylist}
            title={copy.newPlaylist.replace(/^\+\s*/, "")}
            type="button"
          >
            <Plus aria-hidden="true" size={16} strokeWidth={2.2} />
          </button>
        </div>
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

      <div className="sidebar-footer">
        <button className="nav-item nav-item--small" onClick={shell.onOpenAppearance} type="button">
          <Palette aria-hidden="true" className="nav-item-icon" size={17} strokeWidth={2} />
          <span>{shell.copy.appearanceNav}</span>
        </button>
        <button className="nav-item nav-item--small" onClick={shell.onOpenSettings} type="button">
          <Settings aria-hidden="true" className="nav-item-icon" size={17} strokeWidth={2} />
          <span>{shell.copy.settingsNav}</span>
        </button>
        <div className="library-chip" title={shell.scannedPath ?? undefined}>
          <FolderOpen aria-hidden="true" className="library-chip-icon" size={18} strokeWidth={2} />
          <span className="library-chip-copy">
            <strong>{libraryName}</strong>
            <span>{countLabel(shell.libraryTrackCount, shell.copy.trackCountSingular, shell.copy.tracksCountLabel)}</span>
          </span>
          <button
            aria-label={shell.isScanning ? shell.copy.scanning : shell.copy.scanNow}
            className={`library-chip-button${shell.isScanning ? " is-scanning" : ""}`}
            disabled={shell.isScanning}
            onClick={shell.onScanFolder}
            title={shell.isScanning ? shell.copy.scanning : shell.copy.scanNow}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
