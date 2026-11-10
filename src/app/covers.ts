import { invoke } from "@tauri-apps/api/core";
import { storageKeys } from "./constants";
import { isTauriRuntime, readStoredValue, writeStoredValue } from "./utils";

export type CoverEntity = "musicArtist" | "song";

type CacheEntry = { at: number; url: string };

const HIT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** "Nothing found" is retried sooner, in case the catalog adds it. */
const MISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 1500;

let cache: Map<string, CacheEntry> | null = null;
let saveTimer: number | undefined;
const inflight = new Map<string, Promise<string>>();

function loadCache() {
  if (cache) return cache;
  try {
    cache = new Map(Object.entries(JSON.parse(readStoredValue(storageKeys.coverCache) ?? "{}") as Record<string, CacheEntry>));
  } catch {
    cache = new Map();
  }
  return cache;
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const entries = [...loadCache().entries()].slice(-MAX_ENTRIES);
    writeStoredValue(storageKeys.coverCache, JSON.stringify(Object.fromEntries(entries)));
  }, 1000);
}

async function getJson(url: string): Promise<unknown> {
  // In the app the request goes through Rust (`fetch_url`), which avoids CORS.
  if (isTauriRuntime()) {
    return JSON.parse(await invoke<string>("fetch_url", { url }));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

type DeezerTrack = { album?: { cover_big?: string }; artist?: { name?: string } };
type DeezerArtist = { name?: string; picture_big?: string };

/** Lowercase letters/digits only (any script), for comparing artist names. */
const comparableName = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
type DeezerResponse<T> = { data?: T[]; error?: unknown };

async function fromDeezer(term: string, entity: CoverEntity, artist?: string) {
  const query = encodeURIComponent(term);

  if (entity === "musicArtist") {
    const data = (await getJson(`https://api.deezer.com/search/artist?q=${query}&limit=1`)) as DeezerResponse<DeezerArtist>;
    if (data.error) throw new Error("deezer");
    const match = data.data?.[0];
    const picture = match?.picture_big ?? "";
    // A different artist (search fell back to something similar) is worse than
    // no photo; artists without a photo get a generic image with an empty id.
    if (!match || comparableName(match.name ?? "") !== comparableName(term) || picture.includes("/artist//")) {
      return "";
    }
    return picture;
  }

  const data = (await getJson(`https://api.deezer.com/search?q=${query}&limit=8`)) as DeezerResponse<DeezerTrack>;
  if (data.error) throw new Error("deezer");
  const results = data.data ?? [];
  // Prefer the real artist over karaoke/cover versions that rank first.
  const wanted = artist ? comparableName(artist) : "";
  const byArtist = wanted
    ? results.find((item) => {
        const name = comparableName(item.artist?.name ?? "");
        return name && (name === wanted || name.includes(wanted) || wanted.includes(name));
      })
    : undefined;
  return (byArtist ?? (wanted ? undefined : results[0]))?.album?.cover_big ?? "";
}

async function fromItunes(term: string, entity: CoverEntity, _artist?: string) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1&media=music`;
  const response = await fetch(url);
  // 403/429 = rate limited: an error, not "no cover".
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as { results?: { artworkUrl100?: string }[] };
  const artwork = data.results?.[0]?.artworkUrl100;
  return artwork ? artwork.replace(/\d+x\d+bb/, "600x600bb") : "";
}

/**
 * Cover (song) or photo (artist) for a free-text search such as
 * "Artist Song". Deezer first (generous limits), iTunes as backup; results
 * are kept for 30 days so each cover is looked up once. When every source
 * fails (offline, rate limited) nothing is cached, so it is retried later.
 */
export async function findCover(term: string, entity: CoverEntity, artist?: string): Promise<string> {
  const key = `${entity}|${term.trim().toLowerCase()}`;
  if (!term.trim()) return "";

  const entries = loadCache();
  const cached = entries.get(key);
  if (cached && Date.now() - cached.at < (cached.url ? HIT_TTL_MS : MISS_TTL_MS)) {
    return cached.url;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    let url = "";
    let failures = 0;

    for (const source of [fromDeezer, fromItunes]) {
      try {
        url = await source(term, entity, artist);
        if (url) break;
      } catch {
        failures += 1;
      }
    }

    if (url || failures === 0) {
      entries.delete(key);
      entries.set(key, { at: Date.now(), url });
      scheduleSave();
    }

    return url;
  })().finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}

/** Last.fm's grey star image, served when it has no real picture. */
export function isLastfmPlaceholder(url: string) {
  return url.includes("2a96cbd8b46e442fc41c2b86b821562f");
}
