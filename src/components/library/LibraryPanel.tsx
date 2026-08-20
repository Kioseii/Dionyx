import { type RefObject } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { AppLanguage, LibrarySortKey, LibraryTrack, SavedPlaylist } from "../../app/types";

type LibraryPanelCopy = {
  album: string;
  filteredBy: string;
  format: string;
  library: string;
  mainList: string;
  noSearchResultsBody: string;
  noSearchResultsTitle: string;
  noSongsBody: string;
  noSongsTitle: string;
  sortAlbum: string;
  sortArtist: string;
  sortBy: string;
  sortDuration: string;
  sortFormat: string;
  sortMenuLabel: string;
  sortTitle: string;
  time: string;
  trackMenuDelete: string;
  trackMenuEditMeta: string;
  trackTitle: string;
};

type DisplayTrackRow = {
  index: number;
  track: LibraryTrack;
};

type LibraryPanelProps = {
  activePlaylist: SavedPlaylist | null;
  appLanguage: AppLanguage;
  copy: LibraryPanelCopy;
  displayTrackRows: DisplayTrackRow[];
  dragOverPlaylistTrackIndex: number | null;
  draggedPlaylistTrackIndex: number | null;
  getLibrarySortLabel: (sortKey: LibrarySortKey, language: AppLanguage) => string;
  ignoreNextRowClickRef: { current: boolean };
  isLibrarySortMenuOpen: boolean;
  librarySortKey: LibrarySortKey;
  librarySortMenuRef: RefObject<HTMLDivElement | null>;
  normalizedSearch: string;
  onDeleteTrack: (track: LibraryTrack) => void;
  onEditTrack: (track: LibraryTrack) => void;
  onPlaylistTrackDragStart: (index: number) => void;
  onPlaylistTrackDrop: (index: number) => void;
  onSelectTrack: (index: number, shouldAutoplay?: boolean) => void;
  onSetDragOverPlaylistTrackIndex: (index: number) => void;
  onSetIsLibrarySortMenuOpen: (updater: (currentValue: boolean) => boolean) => void;
  onSetLibrarySortKey: (sortKey: LibrarySortKey) => void;
  onSetOpenTrackMenuIndex: (updater: (current: number | null) => number | null) => void;
  onStartMarquee: (element: HTMLElement) => void;
  onStopMarquee: (element: HTMLElement) => void;
  openTrackMenuIndex: number | null;
  searchQuery: string;
  selectedTrackInViewIndex: number;
  sourceTracks: LibraryTrack[];
  trackMenuRef: RefObject<HTMLDivElement | null>;
};

export function LibraryPanel({
  activePlaylist,
  appLanguage,
  copy,
  displayTrackRows,
  dragOverPlaylistTrackIndex,
  draggedPlaylistTrackIndex,
  getLibrarySortLabel,
  ignoreNextRowClickRef,
  isLibrarySortMenuOpen,
  librarySortKey,
  librarySortMenuRef,
  normalizedSearch,
  onDeleteTrack,
  onEditTrack,
  onPlaylistTrackDragStart,
  onPlaylistTrackDrop,
  onSelectTrack,
  onSetDragOverPlaylistTrackIndex,
  onSetIsLibrarySortMenuOpen,
  onSetLibrarySortKey,
  onSetOpenTrackMenuIndex,
  onStartMarquee,
  onStopMarquee,
  openTrackMenuIndex,
  searchQuery,
  selectedTrackInViewIndex,
  sourceTracks,
  trackMenuRef,
}: LibraryPanelProps) {
  return (
    <article className="track-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{copy.library}</p>
          <h3>{activePlaylist ? activePlaylist.name : copy.mainList}</h3>
        </div>
        {activePlaylist ? (
          normalizedSearch ? <span className="muted">{copy.filteredBy}: {searchQuery}</span> : null
        ) : (
          <div className="section-heading-actions">
            {normalizedSearch ? (
              <span className="muted">{copy.filteredBy}: {searchQuery}</span>
            ) : null}
            <div
              className="sort-control"
              ref={librarySortMenuRef}
            >
              <span className="sort-label">{copy.sortBy}</span>
              <button
                aria-expanded={isLibrarySortMenuOpen}
                aria-haspopup="menu"
                className={`sort-trigger ${isLibrarySortMenuOpen ? "open" : ""}`}
                onClick={() => {
                  onSetIsLibrarySortMenuOpen((currentValue) => !currentValue);
                }}
                type="button"
              >
                <span>{getLibrarySortLabel(librarySortKey, appLanguage)}</span>
                <ChevronDown className="sort-trigger-icon" />
              </button>
              {isLibrarySortMenuOpen ? (
                <div
                  aria-label={copy.sortMenuLabel}
                  className="sort-menu"
                  role="menu"
                >
                  {(
                    [
                      ["title", copy.sortTitle],
                      ["artist", copy.sortArtist],
                      ["album", copy.sortAlbum],
                      ["format", copy.sortFormat],
                      ["duration", copy.sortDuration],
                    ] as const
                  ).map(([sortKey, label]) => (
                    <button
                      className={`sort-menu-item ${librarySortKey === sortKey ? "selected" : ""}`}
                      key={sortKey}
                      onClick={() => {
                        onSetLibrarySortKey(sortKey);
                        onSetIsLibrarySortMenuOpen(() => false);
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span>{label}</span>
                      {librarySortKey === sortKey ? (
                        <Check className="sort-menu-check" />
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div
        className="track-table"
        onMouseEnter={(e) => e.currentTarget.classList.add("scrollbar-visible")}
        onMouseLeave={(e) => e.currentTarget.classList.remove("scrollbar-visible")}
      >
        <div className="table-head">
          <span>#</span>
          <span>{copy.trackTitle}</span>
          <span className="album-head">{copy.album}</span>
          <span className="format-head">{copy.format}</span>
          <span className="time-head">{copy.time}</span>
          <span />
        </div>

        {displayTrackRows.length > 0 ? (
          displayTrackRows.map(({ track, index }, displayIndex) => (
            <div
              aria-label={`${track.title} por ${track.artist}`}
              className={`table-row ${index === selectedTrackInViewIndex ? "active" : ""} ${draggedPlaylistTrackIndex === index ? "dragging" : ""} ${dragOverPlaylistTrackIndex === index ? "drop-target" : ""} ${activePlaylist ? "reorderable" : ""}`}
              onMouseEnter={(e) => {
                e.currentTarget.querySelectorAll<HTMLElement>(".marquee-clip").forEach(onStartMarquee);
                if (!activePlaylist || draggedPlaylistTrackIndex === null) return;
                onSetDragOverPlaylistTrackIndex(index);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.querySelectorAll<HTMLElement>(".marquee-clip").forEach(onStopMarquee);
              }}
              onMouseUp={() => {
                if (!activePlaylist || draggedPlaylistTrackIndex === null) {
                  return;
                }
                onPlaylistTrackDrop(index);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectTrack(index, true);
                }
              }}
              key={track.path || `${track.title}-${index}`}
              onClick={() => {
                if (ignoreNextRowClickRef.current) {
                  ignoreNextRowClickRef.current = false;
                  return;
                }

                onSelectTrack(index, true);
              }}
              role="button"
              tabIndex={0}
            >
              <span className="row-index drag-index">
                {activePlaylist ? (
                  <span
                    aria-label={`Mover ${track.title}`}
                    className="drag-handle"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onPlaylistTrackDragStart(index);
                    }}
                    role="button"
                    tabIndex={-1}
                  >
                    ⋮⋮
                  </span>
                ) : null}
                {activePlaylist ? index + 1 : displayIndex + 1}
              </span>
              <div className="track-cell">
                <div className="track-artwork">
                  {track.artworkDataUrl ? (
                    <img
                      alt={`Portada de ${track.album || track.title}`}
                      className="track-artwork-image"
                      src={track.artworkDataUrl}
                    />
                  ) : (
                    <div className="track-artwork-fallback" />
                  )}
                </div>
                <div className="track-copy">
                  <strong className="marquee-clip"><span className="marquee-text">{track.title}</span></strong>
                  <p className="marquee-clip"><span className="marquee-text">{track.artist}</span></p>
                </div>
              </div>
              <span className="album-cell marquee-clip"><span className="marquee-text">{track.album}</span></span>
              <span className="format-pill">{track.format}</span>
              <span className="time-cell duration-cell">{track.duration}</span>
              <div
                className="track-options-wrap"
                ref={openTrackMenuIndex === index ? trackMenuRef : null}
              >
                <button
                  aria-label={`Opciones de ${track.title}`}
                  className="track-options-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    ignoreNextRowClickRef.current = true;
                    onSetOpenTrackMenuIndex((current) => (current === index ? null : index));
                  }}
                  type="button"
                >
                  <span />
                  <span />
                  <span />
                </button>
                {openTrackMenuIndex === index ? (
                  <div className="track-options-menu">
                    <button
                      className="track-menu-item"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditTrack(track);
                      }}
                      type="button"
                    >
                      {copy.trackMenuEditMeta}
                    </button>
                    <button
                      className="track-menu-item danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteTrack(track);
                      }}
                      type="button"
                    >
                      {copy.trackMenuDelete}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : sourceTracks.length > 0 ? (
          <div className="table-empty">
            <strong>{copy.noSearchResultsTitle}</strong>
            <p>{copy.noSearchResultsBody}</p>
          </div>
        ) : (
          <div className="table-empty">
            <strong>{copy.noSongsTitle}</strong>
            <p>{copy.noSongsBody}</p>
          </div>
        )}
      </div>
    </article>
  );
}
