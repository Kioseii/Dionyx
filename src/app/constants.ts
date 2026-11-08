import type { AudioDownloadFormat, EqualizerBand, EqualizerPreset, FontPreset } from "./types";

export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const AUDIO_FORMATS: { id: AudioDownloadFormat; label: string; note?: string }[] = [
  { id: "mp3", label: "MP3", note: "requiere ffmpeg" },
  { id: "flac", label: "FLAC", note: "requiere ffmpeg" },
  { id: "m4a", label: "M4A" },
  { id: "opus", label: "OPUS" },
  { id: "ogg", label: "OGG", note: "requiere ffmpeg" },
  { id: "wav", label: "WAV", note: "requiere ffmpeg" },
];

export const brandName = "DIONYX";
export const defaultThemeColor = "#A85EFF";
export const defaultFontPresetId = "noctis";
export const supportedAudioAccept =
  ".mp3,.flac,.wav,.aiff,.aif,.alac,.m4a,.aac,.ogg,.opus";

export const storageKeys = {
  lastFolderPath: "dionyx:last-folder-path",
  lastTrackPath: "dionyx:last-track-path",
  volume: "dionyx:volume",
  playlists: "dionyx:playlists",
  themeColor: "dionyx:theme-color",
  accentFromArtwork: "dionyx:accent-from-artwork",
  fontPreset: "dionyx:font-preset",
  librarySort: "dionyx:library-sort",
  language: "dionyx:language",
  equalizerEnabled: "dionyx:equalizer-enabled",
  equalizerValues: "dionyx:equalizer-values",
  equalizerPresetId: "dionyx:equalizer-preset-id",
  hideOnTray: "dionyx:hide-on-tray",
  toolsReady: "dionyx:tools-ready",
  sidebarOpen: "dionyx:sidebar-open",
  mainWindowState: "dionyx:main-window-state",
  miniMode: "dionyx:mini-mode",
  miniPlayerPos: "dionyx:mini-player-pos",
  detailPanelOpen: "dionyx:detail-panel-open",
  detailPanelTab: "dionyx:detail-panel-tab",
  libraryView: "dionyx:library-view",
  showRomaji: "dionyx:show-romaji",
} as const;

export const legacyStorageKeys = {
  lastFolderPath: "diony:last-folder-path",
  volume: "diony:volume",
} as const;

export const fontPresets: FontPreset[] = [
  {
    id: "noctis",
    label: "Noctis",
    preview: "Sobria y moderna",
    sample: "Night drive library",
    bodyFamily: '"Bahnschrift", "DIN Alternate", "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    displayFamily: '"Bahnschrift", "DIN Alternate", "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
  },
  {
    id: "velvet",
    label: "Velvet Serif",
    preview: "Elegante y cinematica",
    sample: "After midnight bloom",
    bodyFamily: '"Candara", "Optima", "Segoe UI", -apple-system, sans-serif',
    displayFamily: '"Palatino Linotype", "Book Antiqua", "Palatino", Georgia, serif',
  },
  {
    id: "bruma",
    label: "Bruma",
    preview: "Ornata y romantica",
    sample: "Velvet hours at dusk",
    bodyFamily: '"Gabriola", "Apple Chancery", "Palatino Linotype", "Book Antiqua", "Palatino", serif',
    displayFamily: '"Gabriola", "Apple Chancery", "Palatino Linotype", "Book Antiqua", "Palatino", serif',
    sampleStyle: { fontStyle: "italic", letterSpacing: "0.01em" },
  },
  {
    id: "lumiere",
    label: "Lumière",
    preview: "Fluida y elegante",
    sample: "Traces of moonlight",
    bodyFamily: '"Monotype Corsiva", "Segoe Script", "Apple Chancery", "Snell Roundhand", cursive',
    displayFamily: '"Monotype Corsiva", "Segoe Script", "Apple Chancery", "Snell Roundhand", cursive',
    sampleStyle: { letterSpacing: "0.02em" },
  },
];

export const themePresets = [
  { name: "Ultraviolet", value: defaultThemeColor },
  { name: "Crimson", value: "#FF4F88" },
  { name: "Azure", value: "#4F8DFF" },
  { name: "Emerald", value: "#2DD4A3" },
  { name: "Amber", value: "#FFB347" },
  { name: "Ice", value: "#8CE6FF" },
];

export const equalizerBandsConfig: EqualizerBand[] = [
  { id: "31", frequency: "31 Hz" },
  { id: "62", frequency: "62 Hz" },
  { id: "125", frequency: "125 Hz" },
  { id: "250", frequency: "250 Hz" },
  { id: "500", frequency: "500 Hz" },
  { id: "1k", frequency: "1 kHz" },
  { id: "2k", frequency: "2 kHz" },
  { id: "4k", frequency: "4 kHz" },
  { id: "8k", frequency: "8 kHz" },
  { id: "16k", frequency: "16 kHz" },
];

export const equalizerFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const defaultEqualizerValues = equalizerBandsConfig.map(() => 0);

export const equalizerPresets: EqualizerPreset[] = [
  {
    id: "flat",
    labelEn: "Flat",
    labelEs: "Plano",
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "rock",
    labelEn: "Rock",
    labelEs: "Rock",
    values: [4, 3, 2, 0, -1, 0, 2, 4, 3, 2],
  },
  {
    id: "heavy-metal",
    labelEn: "Heavy Metal",
    labelEs: "Heavy Metal",
    values: [5, 4, 2, -1, -3, -3, 2, 5, 4, 2],
  },
  {
    id: "bass-boost",
    labelEn: "Bass Boost",
    labelEs: "Bass Boost",
    values: [7, 6, 4, 2, 0, -1, -2, -2, -1, 0],
  },
  {
    id: "vocal",
    labelEn: "Vocal",
    labelEs: "Vocal",
    values: [-3, -4, -2, 0, 2, 4, 5, 4, 2, -1],
  },
  {
    id: "electronic",
    labelEn: "Electronic",
    labelEs: "Electronica",
    values: [6, 5, 2, 0, -1, 0, 1, 3, 4, 5],
  },
  {
    id: "acoustic",
    labelEn: "Acoustic",
    labelEs: "Acustica",
    values: [-1, 0, 2, 2, 1, 1, 2, 3, 2, 2],
  },
];

export const DISCOVER_SEED_ARTISTS_PER_PAGE = 8;

export const downloadToolsCopy = {
  installedEs: "Instalado",
  installedEn: "Installed",
  installEs: "Instalar",
  installEn: "Install",
  toolsEs: "Herramientas",
  toolsEn: "Tools",
  toolsTitleEs: "yt-dlp y ffmpeg",
  toolsTitleEn: "yt-dlp & ffmpeg",
  toolsHintEs: "Necesarias para descargar audio desde YouTube.",
  toolsHintEn: "Required to download audio from YouTube.",
  recheckEs: "Comprobar",
  recheckEn: "Check",
} as const;
