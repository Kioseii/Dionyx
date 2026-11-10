import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { storageKeys } from "../app/constants";
import {
  appendToQueue,
  buildScrobbleItem,
  classifyLastfmError,
  type ScrobbleItem,
} from "../app/scrobble";
import type { LibraryTrack } from "../app/types";
import { isTauriRuntime, readStoredValue, writeStoredValue } from "../app/utils";

type LastfmSession = { key: string; name: string };
export type LastfmConnectState = "idle" | "waiting" | "error";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60_000;
const BATCH_SIZE = 50;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = readStoredValue(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Last.fm scrobbling with the listener's own account: connect (browser
 * approval), "now playing" updates, scrobbles once Last.fm's rule is met
 * (half the song or 4 minutes), and a queue that keeps plays made offline
 * until they can be sent.
 */
export function useLastfm() {
  const [configured, setConfigured] = useState(false);
  const [session, setSession] = useState<LastfmSession | null>(() =>
    readJson<LastfmSession | null>(storageKeys.lastfmSession, null),
  );
  const [enabled, setEnabled] = useState(() => readStoredValue(storageKeys.lastfmEnabled) !== "false");
  const [connectState, setConnectState] = useState<LastfmConnectState>("idle");
  const [queueCount, setQueueCount] = useState(() => readJson<ScrobbleItem[]>(storageKeys.lastfmQueue, []).length);
  const [scrobbledCount, setScrobbledCount] = useState(0);

  const queueRef = useRef<ScrobbleItem[]>(readJson<ScrobbleItem[]>(storageKeys.lastfmQueue, []));
  const sendingRef = useRef(false);
  const pollRef = useRef<{ cancelled: boolean } | null>(null);
  const latestRef = useRef({ session });
  latestRef.current = { session };

  const active = configured && Boolean(session) && enabled;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void invoke<boolean>("lastfm_is_configured")
      .then(setConfigured)
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    writeStoredValue(storageKeys.lastfmEnabled, String(enabled));
  }, [enabled]);

  const saveQueue = (queue: ScrobbleItem[]) => {
    queueRef.current = queue;
    setQueueCount(queue.length);
    writeStoredValue(storageKeys.lastfmQueue, JSON.stringify(queue));
  };

  const disconnect = useCallback(() => {
    pollRef.current && (pollRef.current.cancelled = true);
    setSession(null);
    setConnectState("idle");
    writeStoredValue(storageKeys.lastfmSession, "");
  }, []);

  /** Sends what is queued, oldest first, in batches. Network trouble keeps it queued. */
  const flushQueue = useCallback(async () => {
    const current = latestRef.current.session;
    if (!current || sendingRef.current) return;
    sendingRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const batch = queueRef.current.slice(0, BATCH_SIZE);
        try {
          const accepted = await invoke<number>("lastfm_scrobble", { items: batch, sessionKey: current.key });
          setScrobbledCount((count) => count + accepted);
          saveQueue(queueRef.current.slice(batch.length));
        } catch (error) {
          const kind = classifyLastfmError(error);
          if (kind === "invalid-session") {
            disconnect();
          } else if (kind === "other") {
            // Rejected for good (bad tags...): drop it so it does not block the rest.
            saveQueue(queueRef.current.slice(batch.length));
            continue;
          }
          return;
        }
      }
    } finally {
      sendingRef.current = false;
    }
  }, [disconnect]);

  // Sends what was left from earlier (offline plays) once connected.
  useEffect(() => {
    if (active && queueRef.current.length > 0) void flushQueue();
  }, [active, flushQueue]);

  /** "Now playing" on the profile (called by the listen tracker). */
  const nowPlaying = useCallback(
    (track: LibraryTrack, duration: number) => {
      const current = latestRef.current.session;
      if (!activeRef.current || !current) return;
      const item = buildScrobbleItem(track, duration, Date.now() / 1000);
      if (!item) return;
      void invoke("lastfm_now_playing", {
        album: item.album ?? null,
        artist: item.artist,
        duration: item.duration ?? null,
        sessionKey: current.key,
        track: item.track,
      }).catch((error) => {
        if (classifyLastfmError(error) === "invalid-session") disconnect();
      });
    },
    [disconnect],
  );

  /** Queues and sends a counted play (called by the listen tracker). */
  const scrobble = useCallback(
    (track: LibraryTrack, duration: number, startedAt: number) => {
      if (!activeRef.current) return;
      const item = buildScrobbleItem(track, duration, startedAt);
      if (!item) return;
      saveQueue(appendToQueue(queueRef.current, [item]));
      void flushQueue();
    },
    [flushQueue],
  );

  const connect = useCallback(async () => {
    if (!configured) return;
    pollRef.current && (pollRef.current.cancelled = true);
    const poll = { cancelled: false };
    pollRef.current = poll;
    setConnectState("waiting");

    let token: string;
    try {
      token = await invoke<string>("lastfm_begin_auth");
    } catch {
      if (!poll.cancelled) setConnectState("error");
      return;
    }

    // Wait for the approval in the browser.
    const startedAt = Date.now();
    while (!poll.cancelled && Date.now() - startedAt < POLL_TIMEOUT_MS) {
      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      if (poll.cancelled) return;
      try {
        const next = await invoke<LastfmSession>("lastfm_finish_auth", { token });
        if (poll.cancelled) return;
        setSession(next);
        writeStoredValue(storageKeys.lastfmSession, JSON.stringify(next));
        setConnectState("idle");
        return;
      } catch (error) {
        const kind = classifyLastfmError(error);
        if (kind !== "unauthorized-token" && kind !== "network") {
          setConnectState("error");
          return;
        }
      }
    }

    if (!poll.cancelled) setConnectState("error");
  }, [configured]);

  const cancelConnect = useCallback(() => {
    pollRef.current && (pollRef.current.cancelled = true);
    setConnectState("idle");
  }, []);

  useEffect(() => () => {
    pollRef.current && (pollRef.current.cancelled = true);
  }, []);

  return {
    cancelConnect,
    configured,
    connect,
    connectState,
    disconnect,
    enabled,
    nowPlaying,
    queueCount,
    scrobble,
    scrobbledCount,
    /** Session for other Last.fm features (loved tracks), even with scrobbling paused. */
    sessionKey: configured ? (session?.key ?? null) : null,
    setEnabled,
    userName: session?.name ?? null,
  };
}
