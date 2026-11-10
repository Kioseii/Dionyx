import { songIdentity } from "./history";
import type { LibraryTrack } from "./types";

/** Higher is better: lossless first, then the better lossy codecs. */
const FORMAT_RANK: Record<string, number> = {
  AAC: 3,
  AIF: 4,
  AIFF: 4,
  ALAC: 5,
  FLAC: 5,
  M4A: 3,
  MP3: 1,
  OGG: 2,
  OPUS: 3,
  WAV: 4,
};

export function formatRank(format: string) {
  return FORMAT_RANK[format.toUpperCase()] ?? 0;
}

function seconds(duration: string) {
  const match = /^(\d+):(\d{2})$/.exec(duration);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export type DuplicateGroup = {
  /** Library indices, best copy first. */
  indices: number[];
  title: string;
  artist: string;
};

/**
 * The same song saved more than once (other format or folder): same artist
 * and title (case/punctuation-insensitive) and a duration within 2 seconds
 * when both are known. Each group lists the best-quality copy first.
 */
export function findDuplicates(tracks: LibraryTrack[]): DuplicateGroup[] {
  const byIdentity = new Map<string, number[]>();
  tracks.forEach((track, index) => {
    if (!track.path) return;
    const id = songIdentity(track.artist, track.title);
    byIdentity.set(id, [...(byIdentity.get(id) ?? []), index]);
  });

  const groups: DuplicateGroup[] = [];
  for (const indices of byIdentity.values()) {
    if (indices.length < 2) continue;

    // Same name but clearly different lengths (live vs studio) are not duplicates.
    const clusters: number[][] = [];
    for (const index of indices) {
      const length = seconds(tracks[index].duration);
      const cluster = clusters.find((members) => {
        const other = seconds(tracks[members[0]].duration);
        return length === null || other === null || Math.abs(length - other) <= 2;
      });
      if (cluster) cluster.push(index);
      else clusters.push([index]);
    }

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;
      cluster.sort((left, right) => formatRank(tracks[right].format) - formatRank(tracks[left].format));
      groups.push({ artist: tracks[cluster[0]].artist, indices: cluster, title: tracks[cluster[0]].title });
    }
  }

  return groups.sort((left, right) => left.artist.localeCompare(right.artist) || left.title.localeCompare(right.title));
}
