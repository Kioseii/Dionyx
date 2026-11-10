import { comparableName } from "./covers";
import { songIdentity, type HistoryEntry } from "./history";

export type StatsPeriod = "week" | "month" | "year" | "all";

const DAY = 24 * 60 * 60;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** First second (Unix) counted for a period: last 7 / 30 days, this calendar year, or everything. */
export function periodStart(period: StatsPeriod, now: Date) {
  const today = startOfDay(now).getTime() / 1000;
  if (period === "week") return today - 6 * DAY;
  if (period === "month") return today - 29 * DAY;
  if (period === "year") return new Date(now.getFullYear(), 0, 1).getTime() / 1000;
  return 0;
}

export type RankedArtist = { minutes: number; name: string; plays: number };
export type RankedSong = { artist: string; plays: number; title: string };
export type Bucket = { label: string; plays: number };

export type Stats = {
  buckets: Bucket[];
  byHour: number[];
  distinctArtists: number;
  distinctSongs: number;
  /** Approximate: each counted play adds the song's length. */
  minutes: number;
  plays: number;
  topArtists: RankedArtist[];
  topSongs: RankedSong[];
};

/** Days in a row with at least one play, ending today (or yesterday, if nothing yet today). */
export function listeningStreak(entries: HistoryEntry[], now: Date) {
  const days = new Set(entries.map((entry) => dayKey(new Date(entry.startedAt * 1000))));
  const cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildBuckets(entries: HistoryEntry[], period: StatsPeriod, now: Date, locale: string): Bucket[] {
  if (period === "week" || period === "month") {
    const count = period === "week" ? 7 : 30;
    const first = startOfDay(now);
    first.setDate(first.getDate() - (count - 1));
    const format = new Intl.DateTimeFormat(locale, period === "week" ? { weekday: "short" } : { day: "numeric" });
    const buckets = Array.from({ length: count }, (_, offset) => {
      const date = new Date(first);
      date.setDate(first.getDate() + offset);
      return { key: dayKey(date), label: format.format(date), plays: 0 };
    });
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    for (const entry of entries) {
      const bucket = byKey.get(dayKey(new Date(entry.startedAt * 1000)));
      if (bucket) bucket.plays += 1;
    }
    return buckets.map(({ label, plays }) => ({ label, plays }));
  }

  // Year: its 12 months. All time: the last 12 months.
  const format = new Intl.DateTimeFormat(locale, { month: "short" });
  const firstMonth = period === "year" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const buckets = Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + offset, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: format.format(date), plays: 0 };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const entry of entries) {
    const date = new Date(entry.startedAt * 1000);
    const bucket = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.plays += 1;
  }
  return buckets.map(({ label, plays }) => ({ label, plays }));
}

export function computeStats(
  allEntries: HistoryEntry[],
  period: StatsPeriod,
  now: Date,
  locale = "es",
  limit = 10,
): Stats {
  const start = periodStart(period, now);
  const entries = allEntries.filter((entry) => entry.startedAt >= start);
  const artists = new Map<string, RankedArtist>();
  const songs = new Map<string, RankedSong>();
  const byHour = new Array<number>(24).fill(0);
  let seconds = 0;

  for (const entry of entries) {
    seconds += entry.duration > 0 ? entry.duration : entry.listened;
    byHour[new Date(entry.startedAt * 1000).getHours()] += 1;

    const artistKey = comparableName(entry.artist);
    const artist = artists.get(artistKey) ?? { minutes: 0, name: entry.artist, plays: 0 };
    artist.plays += 1;
    artist.minutes += (entry.duration > 0 ? entry.duration : entry.listened) / 60;
    artists.set(artistKey, artist);

    const songKey = songIdentity(entry.artist, entry.title);
    const song = songs.get(songKey) ?? { artist: entry.artist, plays: 0, title: entry.title };
    song.plays += 1;
    songs.set(songKey, song);
  }

  const byPlays = <T extends { plays: number }>(left: T, right: T) => right.plays - left.plays;

  return {
    buckets: buildBuckets(entries, period, now, locale),
    byHour,
    distinctArtists: artists.size,
    distinctSongs: songs.size,
    minutes: Math.round(seconds / 60),
    plays: entries.length,
    topArtists: [...artists.values()].sort(byPlays).slice(0, limit),
    topSongs: [...songs.values()].sort(byPlays).slice(0, limit),
  };
}
