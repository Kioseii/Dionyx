import { songIdentity } from "./history";

export type FavoriteEntry = {
  addedAt: number;
  artist: string;
  /** songIdentity(artist, title): survives rescans and moved files. */
  id: string;
  /** Last time Last.fm was seen to have it loved (unset = never synced). */
  syncedAt?: number;
  title: string;
};

/** A ❤ change made in DIONYX that Last.fm has not confirmed yet. */
export type PendingLove = { artist: string; id: string; love: boolean; title: string };

export type RemoteLoved = { artist: string; title: string };

export const MAX_PENDING = 500;

/** Keeps only the latest change per song (love then unlove = unlove). */
export function addPending(pending: PendingLove[], change: PendingLove) {
  const next = [...pending.filter((item) => item.id !== change.id), change];
  return next.length > MAX_PENDING ? next.slice(next.length - MAX_PENDING) : next;
}

/**
 * Merges DIONYX favorites with Last.fm loved tracks.
 *  - Loved on Last.fm and not here: added (unless it was just un-❤ here).
 *  - ❤ here and not on Last.fm: sent to Last.fm if it was never synced or
 *    was just ❤; if it had been synced before, it was removed on Last.fm,
 *    so it is removed here too.
 * Returns the merged list and what to send (the caller marks `syncedAt`
 * after Last.fm accepts it, so a failed send is retried, not lost).
 */
export function reconcileFavorites(
  local: FavoriteEntry[],
  remote: RemoteLoved[],
  pending: PendingLove[],
  now: number,
) {
  const pendingById = new Map(pending.map((item) => [item.id, item]));
  const remoteById = new Map(remote.map((item) => [songIdentity(item.artist, item.title), item]));
  const merged = new Map(local.map((entry) => [entry.id, { ...entry }]));
  const toLove: PendingLove[] = [];
  const toUnlove: PendingLove[] = [];

  for (const [id, item] of remoteById) {
    const change = pendingById.get(id);
    if (change && !change.love) {
      toUnlove.push(change);
      merged.delete(id);
      continue;
    }
    const existing = merged.get(id);
    if (existing) {
      existing.syncedAt = now;
    } else {
      merged.set(id, { addedAt: now, artist: item.artist, id, syncedAt: now, title: item.title });
    }
  }

  for (const entry of [...merged.values()]) {
    if (remoteById.has(entry.id)) continue;
    const change = pendingById.get(entry.id);
    if ((change && change.love) || !entry.syncedAt) {
      toLove.push(change ?? { artist: entry.artist, id: entry.id, love: true, title: entry.title });
    } else {
      merged.delete(entry.id);
    }
  }

  return {
    entries: [...merged.values()].sort((left, right) => left.addedAt - right.addedAt),
    toLove,
    toUnlove,
  };
}
