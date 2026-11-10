import { useSyncExternalStore } from "react";
import { storageKeys } from "./constants";
import { addPending, type FavoriteEntry, type PendingLove } from "./favorites";
import { songIdentity } from "./history";
import { readStoredValue, writeStoredValue } from "./utils";

/**
 * Favorites (❤) as a tiny external store: each song row subscribes to its
 * own yes/no, so a ❤ re-renders that row only, not the whole (memoized)
 * library. Saved in localStorage; Last.fm sync lives in use-favorites-sync.
 */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = readStoredValue(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

let entries = new Map(readJson<FavoriteEntry[]>(storageKeys.favorites, []).map((entry) => [entry.id, entry]));
let pending = readJson<PendingLove[]>(storageKeys.favoritesPending, []);
let version = 0;
const listeners = new Set<() => void>();

function commit() {
  version += 1;
  writeStoredValue(storageKeys.favorites, JSON.stringify([...entries.values()]));
  writeStoredValue(storageKeys.favoritesPending, JSON.stringify(pending));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const favoritesStore = {
  has(artist: string, title: string) {
    return entries.has(songIdentity(artist, title));
  },
  list() {
    return [...entries.values()];
  },
  pending() {
    return pending;
  },
  /** Adds or removes the ❤; returns the new state. */
  toggle(track: { artist: string; title: string }) {
    const id = songIdentity(track.artist, track.title);
    const love = !entries.has(id);
    if (love) {
      entries.set(id, { addedAt: Date.now() / 1000, artist: track.artist, id, title: track.title });
    } else {
      entries.delete(id);
    }
    pending = addPending(pending, { artist: track.artist, id, love, title: track.title });
    commit();
    return love;
  },
  /** Result of a Last.fm sync. */
  replace(nextEntries: FavoriteEntry[], nextPending: PendingLove[]) {
    entries = new Map(nextEntries.map((entry) => [entry.id, entry]));
    pending = nextPending;
    commit();
  },
  /** Last.fm confirmed these changes. */
  confirm(confirmed: PendingLove[], now: number) {
    const done = new Set(confirmed.map((item) => item.id));
    pending = pending.filter((item) => !done.has(item.id));
    for (const item of confirmed) {
      const entry = entries.get(item.id);
      if (entry && item.love) entries.set(item.id, { ...entry, syncedAt: now });
    }
    commit();
  },
  subscribe,
  version: () => version,
};

export function useIsFavorite(artist: string, title: string) {
  return useSyncExternalStore(subscribe, () => favoritesStore.has(artist, title));
}

/** Changes whenever any favorite changes (for lists and counts). */
export function useFavoritesVersion() {
  return useSyncExternalStore(subscribe, favoritesStore.version);
}
