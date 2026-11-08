import type { CSSProperties } from "react";

export type TrackSearchResult = {
  id: string;
  title: string;
  channel: string;
  duration: string;
};

export type AudioDownloadFormat = "mp3" | "flac" | "m4a" | "opus" | "ogg" | "wav";

export type DownloadStatus = "fetching" | "pending" | "downloading" | "done" | "error";

export type DownloadItem = {
  id: string;
  url: string;
  title: string;
  format: AudioDownloadFormat;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  error?: string;
};

export type ToolingSupport = {
  platform: "windows" | "macos" | "linux" | "unknown";
  ffmpegInstallMethod: "winget" | "homebrew" | "manual";
  ytdlpInstallMethod: "managed-download" | "manual";
  supportsAutomaticFfmpegInstall: boolean;
  supportsAutomaticYtdlpInstall: boolean;
};

export type LibraryTrack = {
  title: string;
  artist: string;
  album: string;
  format: string;
  quality: string;
  duration: string;
  path: string;
  /** Cover cached on disk by the scan (preferred, served via asset protocol). */
  artworkPath?: string | null;
  /** Inline cover: browser mode, freshly edited metadata, or cache fallback. */
  artworkDataUrl?: string | null;
  source?: string;
};

export type LibraryScan = {
  collectionName: string;
  scannedPath: string;
  trackCount: number;
  tracks: LibraryTrack[];
};

export type SavedPlaylist = {
  id: string;
  name: string;
  sourceCollectionName: string;
  sourcePath: string | null;
  createdAt: number;
  tracks: LibraryTrack[];
};

export type AppLanguage = "es" | "en";
export type PersonalizationView = "theme" | "font" | "settings";
export type LibrarySortKey = "title" | "artist" | "album" | "format" | "duration";
export type RepeatMode = "off" | "all" | "one";

export type FontPreset = {
  bodyFamily: string;
  displayFamily: string;
  id: string;
  label: string;
  preview: string;
  sample: string;
  sampleStyle?: CSSProperties;
};

export type EqualizerBand = {
  frequency: string;
  id: string;
};

export type EqualizerPreset = {
  id: string;
  labelEn: string;
  labelEs: string;
  values: number[];
};

export type DiscoverTab = "foryou" | "charts";

export type LastFmTrack = {
  name: string;
  artist: { name: string } | string;
  playcount?: string;
  listeners?: string;
  image?: { "#text": string; size: string }[];
  coverUrl?: string;
};

export type LastFmArtist = {
  name: string;
  listeners?: string;
  image?: { "#text": string; size: string }[];
  topTracks?: LastFmTrack[];
  coverUrl?: string;
};

export type DiscoverPreviewState = "idle" | "loading" | "playing" | "paused" | "unavailable" | "error";
