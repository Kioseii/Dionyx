import type { CSSProperties } from "react";
import {
  brandName,
  defaultEqualizerValues,
  defaultFontPresetId,
  defaultThemeColor,
  equalizerPresets,
  fontPresets,
  SPEED_PRESETS,
} from "./constants";
import type { AppLanguage, FontPreset, LibrarySortKey, LibraryTrack, SavedPlaylist } from "./types";

export function snapPlaybackRate(value: number): (typeof SPEED_PRESETS)[number] {
  let closest: (typeof SPEED_PRESETS)[number] = SPEED_PRESETS[0];
  let closestDistance = Math.abs(value - closest);

  for (const preset of SPEED_PRESETS) {
    const distance = Math.abs(value - preset);
    if (distance < closestDistance) {
      closest = preset;
      closestDistance = distance;
    }
  }

  return closest;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function readStoredValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored (e.g. quota exceeded). */
export function writeStoredValue(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Keep the app usable; callers that care can react to the false result.
    return false;
  }
}

/**
 * Serializes playlists without heavy or session-only fields: embedded artwork
 * (base64 data URLs can be hundreds of KB per track) and blob: sources from the
 * browser picker, which are dead after a restart.
 */
export function serializePlaylistsForStorage(playlists: SavedPlaylist[]) {
  return JSON.stringify(
    playlists.map((playlist) => ({
      ...playlist,
      tracks: playlist.tracks.map(({ artworkDataUrl: _artwork, source: _source, ...track }) => track),
    })),
  );
}

export function removeStoredValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage issues and keep the app usable.
  }
}

export function clampToDesktopBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  monitors: Array<{
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>,
) {
  if (monitors.length === 0) {
    return { x, y };
  }

  const minX = Math.min(...monitors.map((monitor) => monitor.position.x));
  const minY = Math.min(...monitors.map((monitor) => monitor.position.y));
  const maxX = Math.max(...monitors.map((monitor) => monitor.position.x + monitor.size.width));
  const maxY = Math.max(...monitors.map((monitor) => monitor.position.y + monitor.size.height));

  return {
    x: Math.min(Math.max(x, minX), Math.max(minX, maxX - width)),
    y: Math.min(Math.max(y, minY), Math.max(minY, maxY - height)),
  };
}

export function parseStoredPlaylists(rawValue: string | null): SavedPlaylist[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((playlist): playlist is SavedPlaylist => {
      return (
        typeof playlist === "object" &&
        playlist !== null &&
        typeof playlist.id === "string" &&
        typeof playlist.name === "string" &&
        Array.isArray(playlist.tracks)
      );
    });
  } catch {
    return [];
  }
}

export function sanitizeHexColor(value: string | null | undefined) {
  if (!value) {
    return defaultThemeColor;
  }

  const normalized = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toUpperCase() : defaultThemeColor;
}

export function sanitizeAppLanguage(value: string | null | undefined): AppLanguage {
  return value === "en" ? "en" : "es";
}

export function sanitizeHexDraft(value: string) {
  const hexOnly = value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");

  return `#${hexOnly.slice(0, 6)}`;
}

export function isCompleteHexColor(value: string) {
  return /^#[0-9A-F]{6}$/.test(value);
}

export function sanitizePlainTextInput(value: string, maxLength = 120) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function sanitizeTrack(track: LibraryTrack): LibraryTrack {
  const safeArtworkDataUrl =
    typeof track.artworkDataUrl === "string" &&
    /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/.test(track.artworkDataUrl)
      ? track.artworkDataUrl
      : undefined;

  return {
    ...track,
    title: sanitizePlainTextInput(track.title, 120).trim() || "Unknown Track",
    artist: sanitizePlainTextInput(track.artist, 120).trim() || "Unknown Artist",
    album: sanitizePlainTextInput(track.album, 120).trim() || "Biblioteca local",
    format:
      track.format
        .normalize("NFKC")
        .replace(/[^A-Za-z0-9+.-]/g, "")
        .slice(0, 12)
        .toUpperCase() || "--",
    quality: sanitizePlainTextInput(track.quality, 48).trim() || "Local",
    duration: /^[0-9]{1,3}:[0-9]{2}$/.test(track.duration) ? track.duration : "--:--",
    artworkDataUrl: safeArtworkDataUrl,
  };
}

export function getTrackKey(track: LibraryTrack) {
  return track.path || `${track.title}::${track.artist}::${track.album}::${track.duration}`;
}

export function getEqualizerPresetLabel(presetId: string, language: AppLanguage) {
  if (presetId === "custom") {
    return language === "es" ? "Personalizado" : "Custom";
  }

  const preset = equalizerPresets.find((item) => item.id === presetId);

  if (!preset) {
    return language === "es" ? "Plano" : "Flat";
  }

  return language === "es" ? preset.labelEs : preset.labelEn;
}

export function normalizeTrackToken(value: string | null | undefined, maxLength = 160) {
  return sanitizePlainTextInput(value ?? "", maxLength).trim().toLowerCase();
}

export function getTrackPathLeaf(path: string) {
  const normalized = path.split(/[\\/]/).filter(Boolean).pop() ?? "";

  return normalized.replace(/\.[^.]+$/, "");
}

export function getTrackMatchSignatures(track: LibraryTrack) {
  const title = normalizeTrackToken(track.title, 120);
  const artist = normalizeTrackToken(track.artist, 120);
  const album = normalizeTrackToken(track.album, 120);
  const format = normalizeTrackToken(track.format, 16);
  const duration = normalizeTrackToken(track.duration, 12);
  const fileLeaf = normalizeTrackToken(getTrackPathLeaf(track.path), 120);

  return Array.from(
    new Set(
      [
        [title, artist, album, format, duration].filter(Boolean).join("::"),
        [title, artist, album, duration].filter(Boolean).join("::"),
        [title, artist, duration].filter(Boolean).join("::"),
        [title, album, duration].filter(Boolean).join("::"),
        [title, artist, album].filter(Boolean).join("::"),
        [title, artist].filter(Boolean).join("::"),
        [fileLeaf, duration].filter(Boolean).join("::"),
        [fileLeaf, format].filter(Boolean).join("::"),
        fileLeaf,
      ].filter((signature) => signature.length > 0),
    ),
  );
}

export function findMatchingTrackIndex(targetTrack: LibraryTrack, candidateTracks: LibraryTrack[]) {
  const normalizedPath = normalizeTrackToken(targetTrack.path, 320);

  if (normalizedPath) {
    const exactPathIndex = candidateTracks.findIndex(
      (track) => normalizeTrackToken(track.path, 320) === normalizedPath,
    );

    if (exactPathIndex >= 0) {
      return exactPathIndex;
    }
  }

  const candidateSignatureMap = new Map<string, number>();

  candidateTracks.forEach((track, index) => {
    getTrackMatchSignatures(track).forEach((signature) => {
      if (!candidateSignatureMap.has(signature)) {
        candidateSignatureMap.set(signature, index);
      }
    });
  });

  for (const signature of getTrackMatchSignatures(targetTrack)) {
    const matchedIndex = candidateSignatureMap.get(signature);

    if (typeof matchedIndex === "number") {
      return matchedIndex;
    }
  }

  return -1;
}

export function reconcilePlaylistsWithLibrary(
  playlists: SavedPlaylist[],
  libraryTracks: LibraryTrack[],
) {
  return playlists.map((playlist) => ({
    ...playlist,
    tracks: playlist.tracks.map((track) => {
      const matchedIndex = findMatchingTrackIndex(track, libraryTracks);

      return matchedIndex >= 0 ? { ...libraryTracks[matchedIndex] } : track;
    }),
  }));
}

export function mergeUniqueTracks(trackLists: LibraryTrack[][]) {
  const trackMap = new Map<string, LibraryTrack>();

  trackLists.flat().forEach((track) => {
    trackMap.set(getTrackKey(track), track);
  });

  return Array.from(trackMap.values());
}

export function hexToRgb(hexColor: string) {
  const normalized = sanitizeHexColor(hexColor).slice(1);

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function mixRgb(
  left: { g: number; r: number; b: number },
  right: { g: number; r: number; b: number },
  weight: number,
) {
  const ratio = Math.min(Math.max(weight, 0), 1);

  return {
    r: Math.round(left.r * (1 - ratio) + right.r * ratio),
    g: Math.round(left.g * (1 - ratio) + right.g * ratio),
    b: Math.round(left.b * (1 - ratio) + right.b * ratio),
  };
}

export function rgbToCss(rgb: { g: number; r: number; b: number }) {
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

export function sanitizeFontPresetId(value: string | null | undefined) {
  if (!value) {
    return defaultFontPresetId;
  }

  const normalized = value.normalize("NFKC").trim().toLowerCase();

  return fontPresets.some((preset) => preset.id === normalized)
    ? normalized
    : defaultFontPresetId;
}

export function sanitizeLibrarySortKey(value: string | null | undefined): LibrarySortKey {
  switch (value) {
    case "artist":
    case "album":
    case "format":
    case "duration":
      return value;
    case "title":
    default:
      return "title";
  }
}

export function parseTrackDuration(duration: string) {
  const match = /^(\d{1,3}):(\d{2})$/.exec(duration);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

export function buildShuffledQueueFromIndices(indices: number[], startPosition: number) {
  if (indices.length === 0) return [];
  const bounded = Math.min(Math.max(startPosition, 0), indices.length - 1);
  const startValue = indices[bounded];
  const remaining = indices.filter((_, i) => i !== bounded);

  for (let i = remaining.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = remaining[i];
    remaining[i] = remaining[j];
    remaining[j] = tmp;
  }

  return [startValue, ...remaining];
}

export function getFontPresetById(id: string) {
  return fontPresets.find((preset) => preset.id === id) ?? fontPresets[0];
}

export function buildThemeStyle(themeColor: string, fontPreset: FontPreset) {
  const accentBase = hexToRgb(themeColor);
  const accentSoft = mixRgb(accentBase, { r: 255, g: 255, b: 255 }, 0.34);
  const accentDeep = mixRgb(accentBase, { r: 24, g: 16, b: 32 }, 0.5);
  const accentDark = mixRgb(accentBase, { r: 10, g: 8, b: 14 }, 0.72);
  const textSoft = mixRgb({ r: 223, g: 210, b: 239 }, accentBase, 0.22);
  const textFaint = mixRgb({ r: 216, g: 199, b: 234 }, accentBase, 0.3);
  const textBright = mixRgb({ r: 241, g: 231, b: 251 }, accentBase, 0.16);

  return {
    "--accent-rgb": rgbToCss(accentBase),
    "--accent-soft-rgb": rgbToCss(accentSoft),
    "--accent-deep-rgb": rgbToCss(accentDeep),
    "--accent-dark-rgb": rgbToCss(accentDark),
    "--text-soft-rgb": rgbToCss(textSoft),
    "--text-faint-rgb": rgbToCss(textFaint),
    "--text-bright-rgb": rgbToCss(textBright),
    "--app-font-family": fontPreset.bodyFamily,
    "--display-font-family": fontPreset.displayFamily,
  } as CSSProperties;
}

export function sanitizeEqualizerEnabled(value: string | null | undefined): boolean {
  return value === "true";
}

export function sanitizeEqualizerValues(value: string | null | undefined): number[] {
  if (!value) {
    return [...defaultEqualizerValues];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed) || parsed.length !== defaultEqualizerValues.length) {
      return [...defaultEqualizerValues];
    }

    const sanitized = parsed.map((gain) => {
      const number = Number(gain);
      return Number.isFinite(number) ? Math.min(Math.max(Math.round(number), -12), 12) : 0;
    });

    return sanitized;
  } catch {
    return [...defaultEqualizerValues];
  }
}

export function sanitizeEqualizerPresetId(value: string | null | undefined): string {
  if (!value) {
    return "flat";
  }

  const normalized = value.normalize("NFKC").trim();
  const validIds = [...equalizerPresets.map((preset) => preset.id), "custom"];

  return validIds.includes(normalized) ? normalized : "flat";
}

export function normalizeTrackLabel(rawName: string) {
  return rawName.replace(/[_]+/g, " ").trim();
}

export function splitArtistAndTitle(rawName: string) {
  const [artist, title] = rawName.split(" - ", 2);

  if (title) {
    return {
      artist: artist.trim(),
      title: title.trim(),
    };
  }

  return {
    artist: "Unknown Artist",
    title: normalizeTrackLabel(rawName),
  };
}

export function inferTrackQuality(format: string, fileSize: number) {
  const localFormats = new Set(["FLAC", "ALAC", "WAV", "AIFF", "AIF"]);
  const sizeInMb = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;

  return localFormats.has(format)
    ? `Lossless local • ${sizeInMb}`
    : `Compressed local • ${sizeInMb}`;
}

export function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "--:--";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function trackFromBrowserFile(file: File, collectionName: string): LibraryTrack {
  const relativePath =
    "webkitRelativePath" in file && typeof file.webkitRelativePath === "string"
      ? file.webkitRelativePath
      : file.name;

  const segments = relativePath.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] ?? file.name;
  const fileStem = fileName.replace(/\.[^.]+$/, "");
  const parentFolder =
    segments.length > 1
      ? segments[segments.length - 2] ?? collectionName
      : collectionName;
  const format = (fileName.split(".").pop() ?? "--").toUpperCase();
  const labels = splitArtistAndTitle(fileStem);

  return {
    title: sanitizePlainTextInput(labels.title, 120).trim() || "Unknown Track",
    artist: sanitizePlainTextInput(labels.artist, 120).trim() || "Unknown Artist",
    album: sanitizePlainTextInput(normalizeTrackLabel(parentFolder), 120).trim() || collectionName,
    format,
    quality: inferTrackQuality(format, file.size),
    duration: "--:--",
    path: relativePath,
    source: URL.createObjectURL(file),
  };
}

export function startMarquee(clip: HTMLElement) {
  const text = clip.querySelector<HTMLElement>(".marquee-text");
  if (!text) return;
  const dist = text.scrollWidth - clip.clientWidth;
  if (dist <= 4) return;
  const duration = Math.min(2800 + dist * 12, 7000);
  clip.style.setProperty("--md", `-${dist}px`);
  clip.style.setProperty("--dur", `${duration}ms`);
  clip.classList.add("marquee-active");
}

export function stopMarquee(clip: HTMLElement) {
  clip.classList.remove("marquee-active");
  clip.style.removeProperty("--md");
  clip.style.removeProperty("--dur");
}

export function normalizeDiscoverLookup(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getEmptyTrackCopy(language: AppLanguage) {
  return {
    title: language === "es" ? "Nada sonando" : "No track loaded",
    artist: language === "es" ? "Escanea una carpeta o elige una cancion" : "Scan a folder or pick a song",
    album: brandName,
    format: "--",
    quality: language === "es" ? "Biblioteca vacia" : "Empty library",
    duration: "--:--",
    path: "",
  } satisfies LibraryTrack;
}
