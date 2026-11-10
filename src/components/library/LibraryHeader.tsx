import type { ReactNode } from "react";
import { ChevronLeft, Disc3, Heart, Play, Shuffle, UserRound } from "lucide-react";
import { countLabel, formatTotalDuration } from "../../app/library-groups";
import { getTrackArtworkSrc } from "../../app/utils";
import type { LibraryView } from "../../hooks/use-library-browse";
import { useShell } from "../layout/ShellContext";

type LibraryHeaderProps = {
  /** Library indices of the rows on screen (what "Play all" plays). */
  visibleIndices: number[];
  /** Shown at the right end of the tabs row (the sort control, in Songs). */
  tabsAside?: ReactNode;
};

/**
 * Library header: title, counts, play buttons and the Songs / Albums /
 * Artists tabs — or, when an album or artist is open, its own header.
 */
export function LibraryHeader({ tabsAside, visibleIndices }: LibraryHeaderProps) {
  const shell = useShell();
  const { activeGroup, copy } = shell;

  if (activeGroup && shell.libraryFilter) {
    const isAlbum = shell.libraryFilter.kind === "album";
    const isFavorites = shell.libraryFilter.kind === "favorites";
    const coverSrc = activeGroup.coverTrack ? getTrackArtworkSrc(activeGroup.coverTrack) : null;
    const meta = [
      isFavorites ? null : isAlbum ? activeGroup.artistName : countLabel(activeGroup.albumCount, copy.albumCountSingular, copy.albumsCountLabel),
      countLabel(activeGroup.indices.length, copy.trackCountSingular, copy.tracksCountLabel),
      activeGroup.totalSeconds > 0 ? formatTotalDuration(activeGroup.totalSeconds, shell.appLanguage) : null,
    ].filter(Boolean);

    return (
      <div className="library-header library-header--group">
        <button className="library-back-button" onClick={shell.onCloseLibraryGroup} type="button">
          <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          {isFavorites ? copy.backToLibrary : isAlbum ? copy.backToAlbums : copy.backToArtists}
        </button>
        <div className="group-hero">
          <div className={`group-hero-cover${isAlbum || isFavorites ? "" : " group-hero-cover--round"}${isFavorites ? " group-hero-cover--favorites" : ""}`}>
            {isFavorites ? (
              <Heart aria-hidden="true" className="group-card-placeholder" fill="currentColor" size={52} strokeWidth={1.6} />
            ) : coverSrc ? (
              <img alt="" className="group-card-image" src={coverSrc} />
            ) : isAlbum ? (
              <Disc3 aria-hidden="true" className="group-card-placeholder" size={44} strokeWidth={1.6} />
            ) : (
              <UserRound aria-hidden="true" className="group-card-placeholder" size={44} strokeWidth={1.6} />
            )}
          </div>
          <div className="group-hero-copy">
            <p className="eyebrow">{isFavorites ? copy.favoritesKind : isAlbum ? copy.albumKind : copy.artistKind}</p>
            <h2 className="library-title">{activeGroup.name}</h2>
            <p className="library-stats">{meta.join(" · ")}</p>
            <PlayButtons indices={visibleIndices} />
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: LibraryView; label: string }> = [
    { id: "songs", label: copy.viewSongs },
    { id: "albums", label: copy.viewAlbums },
    { id: "artists", label: copy.viewArtists },
  ];

  return (
    <div className="library-header">
      <div className="library-header-top">
        <div>
          <h2 className="library-title">{copy.home}</h2>
          <p className="library-stats">
            {[
              countLabel(shell.libraryTrackCount, copy.trackCountSingular, copy.tracksCountLabel),
              countLabel(shell.albumGroups.length, copy.albumCountSingular, copy.albumsCountLabel),
              countLabel(shell.artistGroups.length, copy.artistCountSingular, copy.artistsCountLabel),
            ].join(" · ")}
          </p>
        </div>
        {shell.libraryView === "songs" ? <PlayButtons indices={visibleIndices} /> : null}
      </div>
      <div className="library-tabs-row">
      <div aria-label={copy.home} className="library-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={shell.libraryView === tab.id}
            className={`library-tab${shell.libraryView === tab.id ? " active" : ""}`}
            key={tab.id}
            onClick={() => shell.onSetLibraryView(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabsAside ? <div className="library-tabs-aside">{tabsAside}</div> : null}
      </div>
    </div>
  );
}

function PlayButtons({ indices }: { indices: number[] }) {
  const shell = useShell();
  const disabled = indices.length === 0;

  return (
    <div className="library-play-buttons">
      <button
        className="library-play-button primary"
        disabled={disabled}
        onClick={() => shell.onPlayLibraryIndices(indices, false)}
        type="button"
      >
        <Play aria-hidden="true" size={16} strokeWidth={2.4} />
        {shell.copy.playAll}
      </button>
      <button
        className="library-play-button"
        disabled={disabled}
        onClick={() => shell.onPlayLibraryIndices(indices, true)}
        type="button"
      >
        <Shuffle aria-hidden="true" size={16} strokeWidth={2.2} />
        {shell.copy.shufflePlay}
      </button>
    </div>
  );
}
