import { useCallback, useRef } from "react";
import { Compass, Disc3, ListMusic, Maximize2, Pause, Play, Plus, UserRound } from "lucide-react";
import { countLabel, getRecentlyAddedAlbums } from "../../app/library-groups";
import { getTrackArtworkSrc } from "../../app/utils";
import { GroupCard } from "../library/LibraryGroupsGrid";
import { useShell } from "../layout/ShellContext";

const RECENT_ALBUMS_LIMIT = 8;

function greetingFor(hour: number, copy: { greetingAfternoon: string; greetingEvening: string; greetingMorning: string }) {
  if (hour >= 5 && hour < 12) return copy.greetingMorning;
  if (hour >= 12 && hour < 20) return copy.greetingAfternoon;
  return copy.greetingEvening;
}

/** Start page: what is playing, recently added albums, playlists and shortcuts. */
export function HomePage() {
  const shell = useShell();
  const { copy, currentTrack } = shell;
  const hasTrack = Boolean(currentTrack.path || currentTrack.source);
  const currentCover = hasTrack ? getTrackArtworkSrc(currentTrack) : null;
  const recentAlbums = getRecentlyAddedAlbums(shell.albumGroups, RECENT_ALBUMS_LIMIT);

  // Stable callbacks for the memoized album cards.
  const latestRef = useRef(shell);
  latestRef.current = shell;
  const openAlbum = useCallback((key: string) => latestRef.current.onOpenAlbum(key), []);
  const playIndices = useCallback((indices: number[]) => latestRef.current.onPlayLibraryIndices(indices), []);

  return (
    <div className="app-page home-page">
      <header className="app-page-header">
        <h1 className="app-page-title">{greetingFor(new Date().getHours(), copy)}</h1>
        <p className="library-stats">
          {[
            countLabel(shell.libraryTrackCount, copy.trackCountSingular, copy.tracksCountLabel),
            countLabel(shell.albumGroups.length, copy.albumCountSingular, copy.albumsCountLabel),
            countLabel(shell.artistGroups.length, copy.artistCountSingular, copy.artistsCountLabel),
          ].join(" · ")}
        </p>
      </header>

      {shell.libraryTrackCount === 0 ? (
        <section className="home-empty">
          <strong>{copy.homeEmptyTitle}</strong>
          <p>{copy.homeEmptyBody}</p>
          <button className="library-play-button primary" onClick={shell.onScanFolder} type="button">
            {copy.scanFolders}
          </button>
        </section>
      ) : null}

      {hasTrack ? (
        <section aria-labelledby="home-now" className="home-section">
          <h2 className="home-section-title" id="home-now">
            {shell.isPlaying ? copy.homeNowPlaying : copy.homeLastTrack}
          </h2>
          <div className="home-now-card">
            <button
              aria-label={copy.fullscreen}
              className="home-now-cover"
              onClick={shell.onOpenNowPlaying}
              type="button"
            >
              {currentCover ? <img alt="" src={currentCover} /> : <Disc3 aria-hidden="true" size={34} strokeWidth={1.6} />}
            </button>
            <div className="home-now-copy">
              <strong className="home-now-title">{currentTrack.title}</strong>
              <span className="home-now-meta">
                <button className="player-link" onClick={() => shell.onOpenTrackArtist(currentTrack)} type="button">
                  {currentTrack.artist}
                </button>
                {" · "}
                <button className="player-link" onClick={() => shell.onOpenTrackAlbum(currentTrack)} type="button">
                  {currentTrack.album}
                </button>
              </span>
            </div>
            <div className="home-now-actions">
              <button className="library-play-button primary" onClick={shell.onTogglePlayback} type="button">
                {shell.isPlaying ? (
                  <Pause aria-hidden="true" size={16} strokeWidth={2.4} />
                ) : (
                  <Play aria-hidden="true" size={16} strokeWidth={2.4} />
                )}
                {shell.isPlaying ? copy.pause : copy.resume}
              </button>
              <button
                aria-label={copy.fullscreen}
                className="library-play-button"
                onClick={shell.onOpenNowPlaying}
                title={copy.fullscreen}
                type="button"
              >
                <Maximize2 aria-hidden="true" size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {recentAlbums.length > 0 ? (
        <section aria-labelledby="home-recent" className="home-section">
          <div className="home-section-heading">
            <h2 className="home-section-title" id="home-recent">{copy.recentlyAdded}</h2>
            <button className="home-see-all" onClick={() => shell.onBrowseLibrary("albums")} type="button">
              {copy.seeAll}
            </button>
          </div>
          <div className="group-grid group-grid--album home-album-row">
            {recentAlbums.map((album) => (
              <GroupCard
                group={album}
                key={album.key}
                kind="album"
                onOpen={openAlbum}
                onPlay={playIndices}
                playLabel={copy.playGroup}
                subtitle={album.artistName ?? ""}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="home-playlists" className="home-section">
        <div className="home-section-heading">
          <h2 className="home-section-title" id="home-playlists">{copy.yourPlaylists}</h2>
          <button className="home-see-all" onClick={shell.onCreatePlaylist} type="button">
            <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
            {copy.createPlaylist}
          </button>
        </div>
        {shell.playlists.length > 0 ? (
          <div className="home-tile-grid">
            {shell.playlists.map((playlist) => {
              const coverTrack = playlist.tracks.find((track) => getTrackArtworkSrc(track));
              const coverSrc = coverTrack ? getTrackArtworkSrc(coverTrack) : null;

              return (
                <button className="home-tile" key={playlist.id} onClick={() => shell.onOpenPlaylist(playlist.id)} type="button">
                  <span className="home-tile-cover">
                    {coverSrc ? <img alt="" src={coverSrc} /> : <ListMusic aria-hidden="true" size={22} strokeWidth={2} />}
                  </span>
                  <span className="home-tile-copy">
                    <strong>{playlist.name}</strong>
                    <span>{countLabel(playlist.tracks.length, copy.trackCountSingular, copy.tracksCountLabel)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="home-muted">{copy.noPlaylistsHint}</p>
        )}
      </section>

      <section aria-labelledby="home-explore" className="home-section">
        <h2 className="home-section-title" id="home-explore">{copy.explore}</h2>
        <div className="home-tile-grid">
          <button className="home-tile" onClick={() => shell.onBrowseLibrary("albums")} type="button">
            <span className="home-tile-cover"><Disc3 aria-hidden="true" size={22} strokeWidth={2} /></span>
            <span className="home-tile-copy">
              <strong>{copy.viewAlbums}</strong>
              <span>{countLabel(shell.albumGroups.length, copy.albumCountSingular, copy.albumsCountLabel)}</span>
            </span>
          </button>
          <button className="home-tile" onClick={() => shell.onBrowseLibrary("artists")} type="button">
            <span className="home-tile-cover home-tile-cover--round"><UserRound aria-hidden="true" size={22} strokeWidth={2} /></span>
            <span className="home-tile-copy">
              <strong>{copy.viewArtists}</strong>
              <span>{countLabel(shell.artistGroups.length, copy.artistCountSingular, copy.artistsCountLabel)}</span>
            </span>
          </button>
          <button className="home-tile" onClick={shell.onOpenDiscover} type="button">
            <span className="home-tile-cover"><Compass aria-hidden="true" size={22} strokeWidth={2} /></span>
            <span className="home-tile-copy">
              <strong>{copy.discoverNav}</strong>
              <span>{copy.discoverTileHint}</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
