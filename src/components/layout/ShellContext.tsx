import { createContext, useContext } from "react";
import type { LibraryFilter, TrackGroup } from "../../app/library-groups";
import type { AppLanguage, LibraryTrack, SavedPlaylist } from "../../app/types";
import type { LibraryView } from "../../hooks/use-library-browse";
import type { uiText } from "../../app/ui";

export type DetailPanelTab = "now" | "lyrics" | "queue";

/** Full pages shown in the main area instead of the library / Discover. */
export type ShellPage = "home" | "downloads" | "appearance" | "settings";

/**
 * State and actions of the app "shell" (sidebar shortcuts, right panel,
 * notices) that several distant components share. Kept in a context so these
 * cross-cutting values do not have to travel through every props builder.
 */
export type ShellContextValue = {
  /** Accent follows the playing cover (falls back to the chosen color). */
  accentFromArtwork: boolean;
  onToggleAccentFromArtwork: () => void;
  activeDownloadCount: number;
  /** Page shown in the main area, or null for the library / Discover. */
  activePage: ShellPage | null;
  onOpenHome: () => void;
  currentTrack: LibraryTrack;
  isPlaying: boolean;
  onBrowseLibrary: (view: LibraryView) => void;
  onCreatePlaylist: () => void;
  onOpenDiscover: () => void;
  onOpenPlaylist: (playlistId: string) => void;
  onTogglePlayback: () => void;
  playlists: SavedPlaylist[];
  /** Ref callback for the element pages are rendered into (via portals). */
  onPageRootChange: (element: HTMLElement | null) => void;
  pageRoot: HTMLElement | null;
  /** Open album/artist (null on the grids and in the songs list). */
  activeGroup: TrackGroup | null;
  albumGroups: TrackGroup[];
  appLanguage: AppLanguage;
  artistGroups: TrackGroup[];
  libraryFilter: LibraryFilter;
  libraryView: LibraryView;
  onCloseLibraryGroup: () => void;
  onOpenAlbum: (albumKey: string) => void;
  onOpenArtist: (artistKey: string) => void;
  onOpenTrackAlbum: (track: LibraryTrack) => void;
  onOpenTrackArtist: (track: LibraryTrack) => void;
  /** Plays library tracks as the queue (shuffled when `shuffle` is true). */
  onPlayLibraryIndices: (indices: number[], shuffle?: boolean) => void;
  onSetLibraryView: (view: LibraryView) => void;
  nowPlayingOpen: boolean;
  onCloseNowPlaying: () => void;
  onOpenNowPlaying: () => void;
  collectionName: string;
  copy: (typeof uiText)[AppLanguage];
  detailPanelOpen: boolean;
  detailPanelTab: DetailPanelTab;
  isNoticeVisible: boolean;
  isScanning: boolean;
  libraryTrackCount: number;
  onDismissNotice: () => void;
  onEnterMiniMode: () => void;
  onOpenAppearance: () => void;
  onOpenDownloads: () => void;
  onOpenEqualizer: () => void;
  onOpenSettings: () => void;
  onScanFolder: () => void;
  /** Opens the right panel on `tab`; if it already shows that tab, hides it. */
  onShowDetailPanel: (tab: DetailPanelTab) => void;
  onToggleDetailPanel: () => void;
  scannedPath: string | null;
  statusMessage: string;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export const ShellProvider = ShellContext.Provider;

export function useShell() {
  const value = useContext(ShellContext);

  if (!value) {
    throw new Error("useShell must be used inside <ShellProvider>");
  }

  return value;
}
