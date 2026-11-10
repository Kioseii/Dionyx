import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { storageKeys } from "../app/constants";
import { reconcileFavorites, type PendingLove, type RemoteLoved } from "../app/favorites";
import { favoritesStore } from "../app/favorites-store";
import { lastfmPublicGet } from "../app/lastfm-public";
import { isTauriRuntime, readStoredValue, writeStoredValue } from "../app/utils";

const FULL_SYNC_EVERY_MS = 6 * 60 * 60 * 1000;
const PUSH_DELAY_MS = 1500;
const MAX_PAGES = 10;

type LovedPage = {
  lovedtracks?: {
    "@attr"?: { totalPages?: string };
    track?: Array<{ artist?: { name?: string } | string; name?: string }>;
  };
};

async function fetchLovedTracks(userName: string): Promise<RemoteLoved[]> {
  const loved: RemoteLoved[] = [];
  let totalPages = 1;

  for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
    const data = await lastfmPublicGet<LovedPage>({
      limit: "1000",
      method: "user.getLovedTracks",
      page: String(page),
      user: userName,
    });
    totalPages = Number(data.lovedtracks?.["@attr"]?.totalPages ?? 1);
    for (const track of data.lovedtracks?.track ?? []) {
      const artist = typeof track.artist === "string" ? track.artist : track.artist?.name;
      if (artist && track.name) loved.push({ artist, title: track.name });
    }
  }

  return loved;
}

/**
 * Keeps ❤ Favorites and Last.fm "Loved Tracks" in step while an account is
 * connected: a full merge at start (at most every 6 hours) and each local ❤
 * change sent right away. Changes made offline stay pending until sent.
 */
export function useFavoritesSync({ sessionKey, userName }: { sessionKey: string | null; userName: string | null }) {
  const busyRef = useRef(false);
  const accountRef = useRef({ sessionKey, userName });
  accountRef.current = { sessionKey, userName };

  const send = useCallback(async (changes: PendingLove[]) => {
    const key = accountRef.current.sessionKey;
    if (!key || changes.length === 0) return;
    const confirmed: PendingLove[] = [];

    for (const change of changes) {
      try {
        await invoke("lastfm_love", { artist: change.artist, love: change.love, sessionKey: key, track: change.title });
        confirmed.push(change);
      } catch {
        // Offline or rejected: stays pending for the next attempt.
      }
    }

    if (confirmed.length > 0) favoritesStore.confirm(confirmed, Date.now() / 1000);
  }, []);

  const fullSync = useCallback(async () => {
    const { sessionKey: key, userName: user } = accountRef.current;
    if (!key || !user || busyRef.current) return;
    busyRef.current = true;

    try {
      const remote = await fetchLovedTracks(user);
      const now = Date.now() / 1000;
      const result = reconcileFavorites(favoritesStore.list(), remote, favoritesStore.pending(), now);
      favoritesStore.replace(result.entries, favoritesStore.pending());
      await send([...result.toLove, ...result.toUnlove]);
      // Other pending changes (e.g. made offline) go out too.
      await send(favoritesStore.pending());
      writeStoredValue(storageKeys.favoritesSyncedAt, String(Date.now()));
    } catch {
      // Last.fm unreachable: try again next time.
    } finally {
      busyRef.current = false;
    }
  }, [send]);

  // Full merge when an account is (re)connected, then every 6 hours.
  useEffect(() => {
    if (!isTauriRuntime() || !sessionKey || !userName) return;
    const last = Number(readStoredValue(storageKeys.favoritesSyncedAt) ?? 0);
    const wait = Math.max(0, last + FULL_SYNC_EVERY_MS - Date.now());
    // Due now: shortly after start (let the app settle); otherwise when 6 h have passed.
    const first = window.setTimeout(() => void fullSync(), wait === 0 ? 3000 : wait);
    const every = window.setInterval(() => void fullSync(), FULL_SYNC_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [fullSync, sessionKey, userName]);

  // Each ❤ / un-❤ goes to Last.fm shortly after it is made.
  useEffect(() => {
    if (!isTauriRuntime() || !sessionKey) return;
    let timer = 0;
    const unsubscribe = favoritesStore.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!busyRef.current) void send(favoritesStore.pending());
      }, PUSH_DELAY_MS);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [send, sessionKey]);
}
