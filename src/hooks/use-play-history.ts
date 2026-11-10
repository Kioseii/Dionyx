import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { HistoryEntry } from "../app/history";
import { isTauriRuntime } from "../app/utils";
import type { CountedPlay } from "./use-listen-tracker";

/**
 * Listening history (Rust keeps it in history.jsonl). Loaded once at start;
 * each counted play is added in memory and appended on disk.
 */
export function usePlayHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let cancelled = false;
    void invoke<HistoryEntry[]>("history_read")
      .then((loaded) => {
        if (!cancelled) setEntries((current) => [...loaded, ...current]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const record = useCallback((play: CountedPlay) => {
    const entry: HistoryEntry = {
      album: play.track.album,
      artist: play.track.artist,
      duration: Math.round(play.duration),
      key: play.trackKey,
      listened: Math.round(play.listened),
      startedAt: Math.floor(play.startedAt),
      title: play.track.title,
    };
    setEntries((current) => [...current, entry]);
    if (isTauriRuntime()) {
      void invoke("history_append", { entry }).catch(() => {});
    }
  }, []);

  return { entries, record };
}
