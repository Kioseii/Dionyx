import { comparableName } from "./covers";
import type { LibraryTrack } from "./types";

/** One play, as stored by Rust in history.jsonl. */
export type HistoryEntry = {
  album: string;
  artist: string;
  duration: number;
  key: string;
  listened: number;
  startedAt: number;
  title: string;
};

/**
 * Identity of a song that survives rescans and moved files: artist + title,
 * case/width/punctuation-insensitive (any script).
 */
export function songIdentity(artist: string, title: string) {
  return `${comparableName(artist)}::${comparableName(title)}`;
}

/** Library index of each song identity (first copy wins). */
export function indexByIdentity(tracks: LibraryTrack[]) {
  const map = new Map<string, number>();
  tracks.forEach((track, index) => {
    const id = songIdentity(track.artist, track.title);
    if (!map.has(id)) map.set(id, index);
  });
  return map;
}

/** Library indices of the last distinct songs played, newest first. */
export function recentlyPlayed(entries: HistoryEntry[], library: Map<string, number>, limit: number) {
  const seen = new Set<number>();
  const result: number[] = [];

  for (let index = entries.length - 1; index >= 0 && result.length < limit; index -= 1) {
    const entry = entries[index];
    const libraryIndex = library.get(songIdentity(entry.artist, entry.title));
    if (libraryIndex === undefined || seen.has(libraryIndex)) continue;
    seen.add(libraryIndex);
    result.push(libraryIndex);
  }

  return result;
}

/** Library indices of the most played songs since `sinceSeconds`, with their play counts. */
export function mostPlayed(
  entries: HistoryEntry[],
  library: Map<string, number>,
  sinceSeconds: number,
  limit: number,
) {
  const counts = new Map<number, { count: number; last: number }>();

  for (const entry of entries) {
    if (entry.startedAt < sinceSeconds) continue;
    const libraryIndex = library.get(songIdentity(entry.artist, entry.title));
    if (libraryIndex === undefined) continue;
    const current = counts.get(libraryIndex) ?? { count: 0, last: 0 };
    current.count += 1;
    current.last = Math.max(current.last, entry.startedAt);
    counts.set(libraryIndex, current);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1].count - left[1].count || right[1].last - left[1].last)
    .slice(0, limit)
    .map(([index, { count }]) => ({ count, index }));
}
