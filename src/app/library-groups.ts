import type { LibraryTrack } from "./types";
import { parseTrackDuration } from "./utils";

/** A group of library tracks (an album or an artist). Indices point into the library `tracks`. */
export type TrackGroup = {
  key: string;
  name: string;
  /** Album: its artist (or "various"); artist: unused. */
  artistName: string | null;
  indices: number[];
  /** First track of the group that has a cover, for the card image. */
  coverTrack: LibraryTrack | null;
  totalSeconds: number;
  /** Artist groups only: number of distinct albums. */
  albumCount: number;
  /** Newest file modification time in the group (Unix seconds, 0 if unknown). */
  latestAddedAt: number;
};

export type LibraryFilter = { kind: "album" | "artist" | "favorites"; key: string } | null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Case/width-insensitive key that keeps non-Latin scripts (unlike the Discover normalizer). */
export function normalizeGroupKey(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * The main artist of an artist field: the part before the first separator
 * ("A, B", "A; B", "A / B", "A & B", "A × B", "A feat. B", "A ft. B").
 */
export function getPrimaryArtist(artist: string) {
  const [primary] = artist.split(/\s*(?:,|;|\/|&|×|\bfeat\.?|\bft\.?|\bfeaturing\b)\s*/i);
  return primary?.trim() || artist.trim() || "Unknown Artist";
}

export function getAlbumKey(track: LibraryTrack) {
  return normalizeGroupKey(track.album) || "__unknown_album";
}

export function getArtistKey(track: LibraryTrack) {
  return normalizeGroupKey(getPrimaryArtist(track.artist)) || "__unknown_artist";
}

function hasCover(track: LibraryTrack) {
  return Boolean(track.artworkPath || track.artworkDataUrl);
}

function seconds(track: LibraryTrack) {
  const value = parseTrackDuration(track.duration);
  return Number.isFinite(value) ? value : 0;
}

/** Album groups, sorted by name; tracks inside in file-name order (≈ track order). */
export function buildAlbumGroups(tracks: LibraryTrack[], variousArtistsLabel: string): TrackGroup[] {
  const groups = new Map<string, { name: string; indices: number[]; artists: Map<string, string> }>();

  tracks.forEach((track, index) => {
    const key = getAlbumKey(track);
    let group = groups.get(key);

    if (!group) {
      group = { name: track.album, indices: [], artists: new Map() };
      groups.set(key, group);
    }

    group.indices.push(index);
    const primary = getPrimaryArtist(track.artist);
    group.artists.set(normalizeGroupKey(primary), primary);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const indices = sortIndicesByPath(group.indices, tracks);
      const coverIndex = indices.find((index) => hasCover(tracks[index]));

      return {
        key,
        name: group.name,
        artistName: group.artists.size === 1 ? [...group.artists.values()][0] : variousArtistsLabel,
        indices,
        coverTrack: coverIndex !== undefined ? tracks[coverIndex] : null,
        totalSeconds: indices.reduce((sum, index) => sum + seconds(tracks[index]), 0),
        albumCount: 1,
        latestAddedAt: latestAdded(indices, tracks),
      };
    })
    .sort((left, right) => collator.compare(left.name, right.name));
}

/** Artist groups (by primary artist), sorted by name; tracks grouped by album. */
export function buildArtistGroups(tracks: LibraryTrack[]): TrackGroup[] {
  const groups = new Map<string, { name: string; indices: number[] }>();

  tracks.forEach((track, index) => {
    const key = getArtistKey(track);
    let group = groups.get(key);

    if (!group) {
      group = { name: getPrimaryArtist(track.artist), indices: [] };
      groups.set(key, group);
    }

    group.indices.push(index);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const indices = [...group.indices].sort((left, right) => {
        const byAlbum = collator.compare(tracks[left].album, tracks[right].album);
        return byAlbum !== 0 ? byAlbum : collator.compare(tracks[left].path, tracks[right].path);
      });
      const coverIndex = indices.find((index) => hasCover(tracks[index]));

      return {
        key,
        name: group.name,
        artistName: null,
        indices,
        coverTrack: coverIndex !== undefined ? tracks[coverIndex] : null,
        totalSeconds: indices.reduce((sum, index) => sum + seconds(tracks[index]), 0),
        albumCount: new Set(indices.map((index) => getAlbumKey(tracks[index]))).size,
        latestAddedAt: latestAdded(indices, tracks),
      };
    })
    .sort((left, right) => collator.compare(left.name, right.name));
}

function latestAdded(indices: number[], tracks: LibraryTrack[]) {
  return indices.reduce((latest, index) => Math.max(latest, tracks[index].modifiedAt ?? 0), 0);
}

/** Albums with the most recently added files first (only those with a date). */
export function getRecentlyAddedAlbums(albums: TrackGroup[], limit: number) {
  return albums
    .filter((album) => album.latestAddedAt > 0)
    .sort((left, right) => right.latestAddedAt - left.latestAddedAt)
    .slice(0, limit);
}

function sortIndicesByPath(indices: number[], tracks: LibraryTrack[]) {
  return [...indices].sort((left, right) => collator.compare(tracks[left].path, tracks[right].path));
}

/** Groups whose name (or album artist) matches the search text. */
export function filterGroups(groups: TrackGroup[], normalizedSearch: string) {
  if (!normalizedSearch) {
    return groups;
  }

  return groups.filter((group) =>
    `${group.name} ${group.artistName ?? ""}`.toLowerCase().includes(normalizedSearch),
  );
}

export function formatTotalDuration(totalSeconds: number, language: "es" | "en") {
  const minutes = Math.round(totalSeconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return language === "es" ? `${hours} h ${rest} min` : `${hours} hr ${rest} min`;
}

/** "1 canción" / "3 canciones". */
export function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
