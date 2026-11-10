import type { LastFmTrack, LibraryTrack } from "./types";

export type TasteSeed = { name: string; weight: number };
export type ArtistTag = { count: number; name: string };

/** Tags that describe the listener or are noise, not a genre. */
const JUNK_TAGS = new Set([
  "seen live",
  "favorites",
  "favorite",
  "favourites",
  "favourite",
  "favorite artists",
  "favourite artists",
  "my favorite",
  "awesome",
  "love",
  "beautiful",
  "amazing",
  "cool",
  "all",
  "spotify",
  "under 2000 listeners",
  "albums i own",
  "check out",
  "good",
  "best",
  "music",
  "male vocalists",
  "female vocalists",
  "male vocalist",
  "female vocalist",
  "singer-songwriter",
]);

/**
 * Most present artists in the library (first credited artist of each song),
 * weighted by how many songs they have.
 */
export function getLibraryArtistSeeds(tracks: LibraryTrack[], limit = 12): TasteSeed[] {
  const counts = new Map<string, { count: number; name: string }>();

  for (const track of tracks) {
    const name = track.artist.split(/[,;/&]| feat\.? | ft\.? /i)[0].trim();
    if (!name || /^unknown artist$/i.test(name)) continue;
    const key = name.toLowerCase();
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { count: 1, name });
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit)
    .map(({ count, name }) => ({ name, weight: Math.log2(count + 1) }));
}

/** Seeds from Last.fm user.getTopArtists (higher playcount, higher weight). */
export function getLastfmArtistSeeds(
  artists: Array<{ name: string; playcount?: string }>,
  limit = 12,
): TasteSeed[] {
  return artists
    .filter((artist) => artist.name?.trim())
    .slice(0, limit)
    .map((artist) => ({ name: artist.name.trim(), weight: Math.log2(Number(artist.playcount ?? 0) + 2) }));
}

/**
 * Combines each seed artist's Last.fm tags into the listener's genres:
 * score = artist weight × tag strength (0–100). Junk tags, years/decades
 * and tags that are just an artist's name are skipped.
 */
export function aggregateTasteTags(
  seeds: Array<{ seed: TasteSeed; tags: ArtistTag[] }>,
  limit = 8,
): string[] {
  const artistNames = new Set(seeds.map(({ seed }) => seed.name.toLowerCase()));
  const scores = new Map<string, { label: string; score: number }>();

  for (const { seed, tags } of seeds) {
    for (const tag of tags.slice(0, 10)) {
      const label = tag.name.trim();
      const key = label.toLowerCase();
      if (!key || JUNK_TAGS.has(key) || artistNames.has(key) || /^\d{2,4}s?$/.test(key)) continue;
      const strength = Math.max(Number(tag.count) || 0, 1) / 100;
      const current = scores.get(key);
      const score = seed.weight * strength;
      if (current) current.score += score;
      else scores.set(key, { label: key, score });
    }
  }

  return [...scores.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.label);
}

const trackKey = (track: LastFmTrack) =>
  `${(typeof track.artist === "string" ? track.artist : track.artist?.name ?? "").toLowerCase()}::${track.name.toLowerCase()}`;

/** Round-robin merge of several ranked lists, without repeats. */
export function interleaveUnique(lists: LastFmTrack[][], limit: number): LastFmTrack[] {
  const seen = new Set<string>();
  const result: LastFmTrack[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));

  for (let index = 0; index < longest && result.length < limit; index += 1) {
    for (const list of lists) {
      const track = list[index];
      if (!track) continue;
      const key = trackKey(track);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(track);
      if (result.length >= limit) break;
    }
  }

  return result;
}
