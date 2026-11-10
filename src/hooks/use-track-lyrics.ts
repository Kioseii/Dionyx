import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { brandName } from "../app/constants";
import { comparableName } from "../app/covers";
import type { LibraryTrack } from "../app/types";
import {
  isTauriRuntime,
  normalizeDiscoverLookup,
  parseTrackDuration,
  sanitizePlainTextInput,
} from "../app/utils";

const LRCLIB_BASE_URL = "https://lrclib.net/api";
const LYRICS_CLIENT_ID = `${brandName} lyrics module`;
const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;

type KuroshiroConvertOptions = {
  delimiter_end?: string;
  delimiter_start?: string;
  mode?: "furigana" | "normal" | "okurigana" | "spaced";
  romajiSystem?: "hepburn" | "nippon" | "passport";
  to?: "hiragana" | "katakana" | "romaji";
};

type KuroshiroInstance = {
  convert(value: string, options?: KuroshiroConvertOptions): Promise<string>;
  init(analyzer: unknown): Promise<void>;
};

type LrclibResponse = {
  albumName?: string;
  artistName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
  trackName?: string;
};

export type LyricsLine = {
  id: string;
  romaji: string | null;
  startTimeMs: number | null;
  text: string;
};

export type TrackLyricsResult = {
  hasRomanji: boolean;
  isInstrumental: boolean;
  isSynced: boolean;
  lines: LyricsLine[];
  sourceLabel: string;
  status: "empty" | "error" | "idle" | "loading" | "ready";
};

type UseTrackLyricsOptions = {
  activeDuration: number;
  displayedPlaybackTime: number;
  selectedTrack: LibraryTrack;
};

let kuroshiroPromise: Promise<KuroshiroInstance> | null = null;
const scriptLoadPromises = new Map<string, Promise<void>>();

function loadBrowserScript(
  src: string,
  globalName: "Kuroshiro" | "KuromojiAnalyzer",
) {
  if (window[globalName]) {
    return Promise.resolve();
  }

  const existingPromise = scriptLoadPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  const scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[data-dionyx-script="${src}"]`);

    const handleLoad = () => {
      if (window[globalName]) {
        resolve();
        return;
      }

      reject(new Error(`lyrics-script-global-missing:${globalName}`));
    };

    const handleError = () => {
      reject(new Error(`lyrics-script-load-failed:${src}`));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.dionyxScript = src;
    script.src = src;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  const trackedPromise = scriptPromise.catch((error) => {
    scriptLoadPromises.delete(src);
    throw error;
  });

  scriptLoadPromises.set(src, trackedPromise);
  return trackedPromise;
}

function getLyricsTrackDuration(activeDuration: number, selectedTrack: LibraryTrack) {
  if (activeDuration > 0) {
    return Math.round(activeDuration);
  }

  const parsedDuration = parseTrackDuration(selectedTrack.duration);
  return Number.isFinite(parsedDuration) ? parsedDuration : 0;
}

function buildLyricsCacheKey(selectedTrack: LibraryTrack, durationSeconds: number) {
  // comparableName keeps every script (a Latin-only normalizer would turn
  // Japanese titles into "" and make different songs share lyrics).
  return [
    comparableName(selectedTrack.title),
    comparableName(selectedTrack.artist),
    comparableName(selectedTrack.album),
    durationSeconds,
  ].join("::");
}

function normalizeLyricsLineText(value: string) {
  return sanitizePlainTextInput(value, 320)
    .replace(/\s*\\n\s*/g, " ")
    .trim();
}

export function parseSyncedLyrics(lyrics: string): LyricsLine[] {
  const parsedLines: LyricsLine[] = [];
  const rawLines = lyrics.split(/\r?\n/);

  rawLines.forEach((rawLine, index) => {
    const matches = [...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];

    if (matches.length === 0) {
      return;
    }

    const text = normalizeLyricsLineText(rawLine.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, ""));

    if (!text) {
      return;
    }

    matches.forEach((match, matchIndex) => {
      const minutes = Number.parseInt(match[1] ?? "0", 10);
      const seconds = Number.parseInt(match[2] ?? "0", 10);
      const decimalText = (match[3] ?? "").padEnd(3, "0").slice(0, 3);
      const milliseconds = Number.parseInt(decimalText || "0", 10);
      const startTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

      parsedLines.push({
        id: `synced-${index}-${matchIndex}-${startTimeMs}`,
        romaji: null,
        startTimeMs,
        text,
      });
    });
  });

  return parsedLines.sort((left, right) => (left.startTimeMs ?? 0) - (right.startTimeMs ?? 0));
}

export function parsePlainLyrics(lyrics: string): LyricsLine[] {
  return lyrics
    .split(/\r?\n/)
    .map((line, index) => ({
      id: `plain-${index}`,
      romaji: null,
      startTimeMs: null,
      text: normalizeLyricsLineText(line),
    }))
    .filter((line) => line.text.length > 0);
}

function scoreLyricsCandidate(candidate: LrclibResponse, selectedTrack: LibraryTrack, durationSeconds: number) {
  let score = 0;
  const targetTitle = normalizeDiscoverLookup(selectedTrack.title);
  const targetArtist = normalizeDiscoverLookup(selectedTrack.artist);
  const targetAlbum = normalizeDiscoverLookup(selectedTrack.album);
  const candidateTitle = normalizeDiscoverLookup(candidate.trackName ?? "");
  const candidateArtist = normalizeDiscoverLookup(candidate.artistName ?? "");
  const candidateAlbum = normalizeDiscoverLookup(candidate.albumName ?? "");

  if (candidateTitle === targetTitle) {
    score += 6;
  } else if (candidateTitle.includes(targetTitle) || targetTitle.includes(candidateTitle)) {
    score += 3;
  }

  if (candidateArtist === targetArtist) {
    score += 5;
  } else if (candidateArtist.includes(targetArtist) || targetArtist.includes(candidateArtist)) {
    score += 2;
  }

  if (targetAlbum && candidateAlbum === targetAlbum) {
    score += 2;
  }

  if (durationSeconds > 0 && typeof candidate.duration === "number") {
    const delta = Math.abs(candidate.duration - durationSeconds);
    if (delta <= 2) {
      score += 3;
    } else if (delta <= 5) {
      score += 1;
    }
  }

  if (candidate.syncedLyrics) {
    score += 2;
  }

  return score;
}

async function fetchLyricsPayload(url: string) {
  if (!isTauriRuntime()) {
    const response = await fetch(url, {
      headers: {
        "Lrclib-Client": LYRICS_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(`lyrics-http-${response.status}`);
    }

    return response.text();
  }

  return invoke<string>("fetch_url", { url });
}

async function getLyricsCandidate(selectedTrack: LibraryTrack, durationSeconds: number) {
  const getUrl = new URL(`${LRCLIB_BASE_URL}/get`);
  getUrl.searchParams.set("track_name", selectedTrack.title);
  getUrl.searchParams.set("artist_name", selectedTrack.artist);
  getUrl.searchParams.set("album_name", selectedTrack.album);
  getUrl.searchParams.set("duration", `${durationSeconds}`);

  try {
    const text = await fetchLyricsPayload(getUrl.toString());
    const data = JSON.parse(text) as LrclibResponse;
    if (data.plainLyrics || data.syncedLyrics || data.instrumental) {
      return data;
    }
  } catch {
    // Fallback to search below.
  }

  const searchUrl = new URL(`${LRCLIB_BASE_URL}/search`);
  searchUrl.searchParams.set("track_name", selectedTrack.title);
  searchUrl.searchParams.set("artist_name", selectedTrack.artist);
  if (selectedTrack.album) {
    searchUrl.searchParams.set("album_name", selectedTrack.album);
  }

  const searchText = await fetchLyricsPayload(searchUrl.toString());
  const searchResults = JSON.parse(searchText) as LrclibResponse[];

  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return null;
  }

  return [...searchResults]
    .sort(
      (left, right) =>
        scoreLyricsCandidate(right, selectedTrack, durationSeconds)
        - scoreLyricsCandidate(left, selectedTrack, durationSeconds),
    )[0] ?? null;
}

async function ensureKuroshiroInstance() {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
      const kuroshiroScriptUrl = new URL("vendor/kuroshiro.min.js", baseUrl).toString();
      const kuromojiScriptUrl = new URL("vendor/kuroshiro-analyzer-kuromoji.min.js", baseUrl).toString();

      await loadBrowserScript(kuroshiroScriptUrl, "Kuroshiro");
      await loadBrowserScript(kuromojiScriptUrl, "KuromojiAnalyzer");

      if (!window.Kuroshiro || !window.KuromojiAnalyzer) {
        throw new Error("lyrics-converter-unavailable");
      }

      // The vendored UMD bundle exposes the class as `Kuroshiro.default`.
      const KuroshiroClass =
        typeof window.Kuroshiro === "function" ? window.Kuroshiro : window.Kuroshiro.default;

      if (typeof KuroshiroClass !== "function") {
        throw new Error("lyrics-converter-unavailable");
      }

      const instance = new KuroshiroClass();
      // Root-relative on purpose: kuromoji joins this with file names using a
      // filesystem-style path.join, which mangles "http://host/..." into a
      // relative "host/..." URL (the request then returns the app's HTML).
      const dictPath = `${new URL(baseUrl).pathname.replace(/\/?$/, "/")}kuromoji-dict/`;
      await instance.init(new window.KuromojiAnalyzer({ dictPath }));
      return instance;
    })().catch((error) => {
      kuroshiroPromise = null;
      throw error;
    });
  }

  return kuroshiroPromise;
}

async function addRomanjiToLyrics(lines: LyricsLine[]) {
  const uniqueJapaneseTexts = Array.from(
    new Set(
      lines
        .map((line) => line.text)
        .filter((text) => JAPANESE_TEXT_PATTERN.test(text)),
    ),
  );

  if (uniqueJapaneseTexts.length === 0) {
    return lines;
  }

  try {
    const kuroshiro = await ensureKuroshiroInstance();
    const romanjiMap = new Map<string, string>();

    await Promise.all(
      uniqueJapaneseTexts.map(async (text) => {
        const converted = await kuroshiro.convert(text, {
          mode: "spaced",
          romajiSystem: "hepburn",
          to: "romaji",
        });
        const normalized = sanitizePlainTextInput(converted, 320).trim();
        romanjiMap.set(text, normalized && normalized !== text ? normalized : "");
      }),
    );

    return lines.map((line) => ({
      ...line,
      romaji: romanjiMap.get(line.text) || null,
    }));
  } catch {
    return lines;
  }
}

function getActiveLyricsLineIndex(lines: LyricsLine[], displayedPlaybackTime: number) {
  if (lines.length === 0) {
    return -1;
  }

  let activeIndex = -1;
  const currentTimeMs = displayedPlaybackTime * 1000;

  for (let index = 0; index < lines.length; index += 1) {
    const startTimeMs = lines[index]?.startTimeMs;

    if (typeof startTimeMs !== "number") {
      continue;
    }

    if (startTimeMs <= currentTimeMs + 120) {
      activeIndex = index;
    } else {
      break;
    }
  }

  return activeIndex;
}

const IDLE_LYRICS: TrackLyricsResult = {
  hasRomanji: false,
  isInstrumental: false,
  isSynced: false,
  lines: [],
  sourceLabel: "LRCLIB",
  status: "idle",
};

/**
 * Shared across every component that shows lyrics (side panel, full-screen
 * view): one LRCLIB request per track, not one per mounted view. Errors are
 * not cached, so a later attempt can retry.
 */
const lyricsResultCache = new Map<string, TrackLyricsResult>();
const lyricsInFlight = new Map<string, Promise<TrackLyricsResult>>();

/** "No lyrics found" answers are asked again after this long. */
const LYRICS_MISS_RETRY_MS = 30 * 24 * 60 * 60 * 1000;

type CachedLyrics = { candidate: LrclibResponse | null; savedAt: number };

/**
 * Lyrics source, in order: a `.lrc` file next to the song, the copy saved on
 * this computer, then LRCLIB (saved for next time). Offline, a saved copy is
 * used even if it is old.
 */
async function getLyricsCandidateOfflineFirst(
  selectedTrack: LibraryTrack,
  durationSeconds: number,
  cacheKey: string,
): Promise<{ candidate: LrclibResponse | null; source: string }> {
  const inApp = isTauriRuntime();

  if (inApp && selectedTrack.path) {
    const lrc = await invoke<string | null>("lyrics_read_lrc", { path: selectedTrack.path }).catch(() => null);
    if (lrc) {
      const synced = /\[\d{1,2}:\d{2}/.test(lrc);
      return { candidate: synced ? { syncedLyrics: lrc } : { plainLyrics: lrc }, source: ".lrc" };
    }
  }

  let cached: CachedLyrics | null = null;
  if (inApp) {
    try {
      const raw = await invoke<string | null>("lyrics_cache_get", { key: cacheKey });
      cached = raw ? (JSON.parse(raw) as CachedLyrics) : null;
    } catch {
      cached = null;
    }
  }

  if (cached && (cached.candidate || Date.now() - cached.savedAt < LYRICS_MISS_RETRY_MS)) {
    return { candidate: cached.candidate, source: "LRCLIB" };
  }

  try {
    const candidate = await getLyricsCandidate(selectedTrack, durationSeconds);
    if (inApp) {
      const saved: CachedLyrics = {
        candidate: candidate
          ? {
              instrumental: candidate.instrumental,
              plainLyrics: candidate.plainLyrics,
              syncedLyrics: candidate.syncedLyrics,
            }
          : null,
        savedAt: Date.now(),
      };
      void invoke("lyrics_cache_set", { key: cacheKey, value: JSON.stringify(saved) }).catch(() => {});
    }
    return { candidate, source: "LRCLIB" };
  } catch (error) {
    if (cached) return { candidate: cached.candidate, source: "LRCLIB" };
    throw error;
  }
}

async function loadTrackLyrics(
  selectedTrack: LibraryTrack,
  durationSeconds: number,
  cacheKey: string,
): Promise<TrackLyricsResult> {
  const { candidate, source } = await getLyricsCandidateOfflineFirst(selectedTrack, durationSeconds, cacheKey);

  if (!candidate) {
    return { ...IDLE_LYRICS, status: "empty" };
  }

  const parsedSyncedLines = candidate.syncedLyrics ? parseSyncedLyrics(candidate.syncedLyrics) : [];
  const parsedPlainLines =
    parsedSyncedLines.length === 0 && candidate.plainLyrics
      ? parsePlainLyrics(candidate.plainLyrics)
      : [];
  const parsedLines = parsedSyncedLines.length > 0 ? parsedSyncedLines : parsedPlainLines;
  const withRomanji = await addRomanjiToLyrics(parsedLines);

  return {
    hasRomanji: withRomanji.some((line) => Boolean(line.romaji)),
    isInstrumental: Boolean(candidate.instrumental),
    isSynced: parsedSyncedLines.length > 0,
    lines: withRomanji,
    sourceLabel: source,
    status: withRomanji.length > 0 || candidate.instrumental ? "ready" : "empty",
  };
}

function getSharedLyrics(cacheKey: string, selectedTrack: LibraryTrack, durationSeconds: number) {
  let pending = lyricsInFlight.get(cacheKey);

  if (!pending) {
    pending = loadTrackLyrics(selectedTrack, durationSeconds, cacheKey)
      .then((loaded) => {
        lyricsResultCache.set(cacheKey, loaded);
        return loaded;
      })
      .finally(() => {
        lyricsInFlight.delete(cacheKey);
      });
    lyricsInFlight.set(cacheKey, pending);
  }

  return pending;
}

export function useTrackLyrics({
  activeDuration,
  displayedPlaybackTime,
  selectedTrack,
}: UseTrackLyricsOptions) {
  const requestIdRef = useRef(0);
  const [result, setResult] = useState<TrackLyricsResult>(IDLE_LYRICS);

  const durationSeconds = useMemo(
    () => getLyricsTrackDuration(activeDuration, selectedTrack),
    [activeDuration, selectedTrack],
  );
  const cacheKey = useMemo(
    () => buildLyricsCacheKey(selectedTrack, durationSeconds),
    [durationSeconds, selectedTrack],
  );

  useEffect(() => {
    if (!selectedTrack.path && !selectedTrack.source) {
      setResult(IDLE_LYRICS);
      return;
    }

    const cached = lyricsResultCache.get(cacheKey);
    if (cached) {
      setResult(cached);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setResult((current) => ({
      ...current,
      lines: [],
      status: "loading",
    }));

    getSharedLyrics(cacheKey, selectedTrack, durationSeconds)
      .then((loaded) => {
        if (requestId === requestIdRef.current) {
          setResult(loaded);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setResult({ ...IDLE_LYRICS, status: "error" });
        }
      });
  }, [cacheKey, durationSeconds, selectedTrack]);

  return {
    ...result,
    activeLineIndex: result.isSynced
      ? getActiveLyricsLineIndex(result.lines, displayedPlaybackTime)
      : -1,
  };
}
