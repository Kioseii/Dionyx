import { useEffect, useMemo, useState } from "react";
import { BarChart3, Disc3, Flame, Music2, Timer, UserRound } from "lucide-react";
import { aggregateTasteTags, type ArtistTag } from "../../app/discover-taste";
import { indexByIdentity, songIdentity } from "../../app/history";
import { lastfmPublicGet } from "../../app/lastfm-public";
import { computeStats, listeningStreak, type RankedArtist, type StatsPeriod } from "../../app/stats";
import { getTrackArtworkSrc, isTauriRuntime } from "../../app/utils";
import { useShell } from "../layout/ShellContext";

const tagCache = new Map<string, ArtistTag[]>();

/** Genres of the most played artists (Last.fm tags), computed in the background. */
function useTopGenres(artists: RankedArtist[]) {
  const [genres, setGenres] = useState<string[]>([]);
  const top = artists.slice(0, 6);
  const key = top.map((artist) => `${artist.name}:${artist.plays}`).join("|");

  useEffect(() => {
    if (!isTauriRuntime() || top.length === 0) {
      setGenres([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const withTags = await Promise.all(
        top.map(async (artist) => {
          if (!tagCache.has(artist.name)) {
            try {
              const data = await lastfmPublicGet<{ toptags?: { tag?: ArtistTag[] } }>({
                artist: artist.name,
                autocorrect: "1",
                method: "artist.getTopTags",
              });
              tagCache.set(artist.name, data.toptags?.tag ?? []);
            } catch {
              tagCache.set(artist.name, []);
            }
          }
          return { seed: { name: artist.name, weight: Math.log2(artist.plays + 1) }, tags: tagCache.get(artist.name) ?? [] };
        }),
      );
      if (!cancelled) setGenres(aggregateTasteTags(withTags, 6));
    })();
    return () => {
      cancelled = true;
    };
    // `key` describes `top`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return genres;
}

function Bars({ items, label }: { items: Array<{ label: string; plays: number }>; label: string }) {
  const max = Math.max(1, ...items.map((item) => item.plays));
  return (
    <div aria-label={label} className="stats-bars" role="img">
      {items.map((item, index) => (
        <div className="stats-bar" key={`${item.label}-${index}`} title={`${item.label}: ${item.plays}`}>
          <span className="stats-bar-fill" style={{ height: `${(item.plays / max) * 100}%` }} />
          <span className="stats-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Statistics page: what you listened to by week, month, year or all time. */
export function StatsPage() {
  const shell = useShell();
  const { copy } = shell;
  const [period, setPeriod] = useState<StatsPeriod>("month");

  const stats = useMemo(
    () => computeStats(shell.historyEntries, period, new Date(), shell.appLanguage),
    [period, shell.appLanguage, shell.historyEntries],
  );
  const streak = useMemo(() => listeningStreak(shell.historyEntries, new Date()), [shell.historyEntries]);
  const genres = useTopGenres(stats.topArtists);
  const libraryByIdentity = useMemo(() => indexByIdentity(shell.libraryTracks), [shell.libraryTracks]);

  const periods: Array<{ id: StatsPeriod; label: string }> = [
    { id: "week", label: copy.statsWeek },
    { id: "month", label: copy.statsMonth },
    { id: "year", label: copy.statsYear },
    { id: "all", label: copy.statsAll },
  ];
  const hours = stats.byHour.map((plays, hour) => ({ label: hour % 6 === 0 ? `${hour}h` : "", plays }));
  const maxArtistPlays = Math.max(1, ...stats.topArtists.map((artist) => artist.plays));

  return (
    <div className="app-page stats-page">
      <header className="app-page-header stats-header">
        <div>
          <h1 className="app-page-title">{copy.statsTitle}</h1>
          <p className="library-stats">{copy.statsHint}</p>
        </div>
        <div aria-label={copy.statsTitle} className="normalization-modes" role="tablist">
          {periods.map((item) => (
            <button
              aria-selected={period === item.id}
              className={`normalization-mode${period === item.id ? " active" : ""}`}
              key={item.id}
              onClick={() => setPeriod(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {stats.plays === 0 ? (
        <section className="page-card stats-empty">
          <BarChart3 aria-hidden="true" size={28} strokeWidth={1.8} />
          <p className="muted">{copy.statsEmpty}</p>
        </section>
      ) : (
        <>
          <div className="stats-tiles">
            {[
              { icon: Timer, label: copy.statsMinutes, value: stats.minutes.toLocaleString() },
              { icon: Music2, label: copy.statsPlays, value: stats.plays.toLocaleString() },
              { icon: Disc3, label: copy.statsSongs, value: stats.distinctSongs.toLocaleString() },
              { icon: UserRound, label: copy.statsArtists, value: stats.distinctArtists.toLocaleString() },
              { icon: Flame, label: copy.statsStreak, value: String(streak) },
            ].map(({ icon: Icon, label, value }) => (
              <div className="page-card stats-tile" key={label}>
                <Icon aria-hidden="true" className="stats-tile-icon" size={18} strokeWidth={2} />
                <strong>{value}</strong>
                <span className="muted">{label}</span>
              </div>
            ))}
          </div>

          {period === "year" && stats.topArtists[0] && stats.topSongs[0] ? (
            <section aria-labelledby="stats-year" className="page-card stats-year">
              <p className="eyebrow" id="stats-year">
                {copy.statsYearTitle} {new Date().getFullYear()}
              </p>
              <div className="stats-year-grid">
                <div>
                  <span className="muted">{copy.statsArtistOfYear}</span>
                  <strong>{stats.topArtists[0].name}</strong>
                </div>
                <div>
                  <span className="muted">{copy.statsSongOfYear}</span>
                  <strong>{stats.topSongs[0].title}</strong>
                </div>
                {genres[0] ? (
                  <div>
                    <span className="muted">{copy.statsGenreOfYear}</span>
                    <strong className="stats-genre-name">{genres[0]}</strong>
                  </div>
                ) : null}
                <div>
                  <span className="muted">{copy.statsMinutes}</span>
                  <strong>{stats.minutes.toLocaleString()}</strong>
                </div>
              </div>
            </section>
          ) : null}

          <div className="page-columns stats-columns">
            <section aria-labelledby="stats-artists" className="page-card">
              <h2 className="page-card-title" id="stats-artists">{copy.statsTopArtists}</h2>
              <ol className="stats-rank">
                {stats.topArtists.map((artist, index) => (
                  <li key={artist.name}>
                    <span className="stats-rank-pos">{index + 1}</span>
                    <span className="stats-rank-name">{artist.name}</span>
                    <span className="stats-rank-meter">
                      <span style={{ width: `${(artist.plays / maxArtistPlays) * 100}%` }} />
                    </span>
                    <span className="stats-rank-count">{artist.plays}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="stats-songs" className="page-card">
              <h2 className="page-card-title" id="stats-songs">{copy.statsTopSongs}</h2>
              <ol className="stats-rank stats-rank--songs">
                {stats.topSongs.map((song, index) => {
                  const libraryIndex = libraryByIdentity.get(songIdentity(song.artist, song.title));
                  const track = libraryIndex === undefined ? null : shell.libraryTracks[libraryIndex];
                  const cover = track ? getTrackArtworkSrc(track) : null;
                  return (
                    <li key={`${song.artist}-${song.title}`}>
                      <span className="stats-rank-pos">{index + 1}</span>
                      {cover ? <img alt="" className="stats-song-cover" loading="lazy" src={cover} /> : <span className="stats-song-cover" />}
                      <button
                        className="stats-song-button"
                        disabled={libraryIndex === undefined}
                        onClick={() => libraryIndex !== undefined && shell.onPlayLibraryIndices([libraryIndex])}
                        type="button"
                      >
                        <strong>{song.title}</strong>
                        <span className="muted">{song.artist}</span>
                      </button>
                      <span className="stats-rank-count">{song.plays}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="stats-when" className="page-card">
              <h2 className="page-card-title" id="stats-when">{copy.statsWhen}</h2>
              <Bars items={stats.buckets} label={copy.statsWhen} />
              <h3 className="stats-subtitle">{copy.statsByHour}</h3>
              <Bars items={hours} label={copy.statsByHour} />
              {genres.length > 0 ? (
                <>
                  <h3 className="stats-subtitle">{copy.statsGenres}</h3>
                  <div className="stats-genres">
                    {genres.map((genre) => (
                      <span className="stats-genre" key={genre}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
