import { useEffect, useMemo, useRef, useState } from "react";
import dionyxLogoRaw from "./assets/dionyx-logo.svg?raw";
import { equalizerBandsConfig, supportedAudioAccept } from "./app/constants";
import { getEmptyTrack, uiText } from "./app/ui";
import { AppModalsHost } from "./components/modals/AppModalsHost";
import { AppMainStageHost } from "./components/layout/AppMainStageHost";
import { NoticeToast } from "./components/layout/NoticeToast";
import { NowPlayingView } from "./components/player/NowPlayingView";
import {
  type DetailPanelTab,
  ShellProvider,
  type ShellContextValue,
  type ShellPage,
} from "./components/layout/ShellContext";
import { TitleBar } from "./components/layout/TitleBar";
import { AudioNodes } from "./components/player/AudioNodes";
import { MiniPlayerOverlay } from "./components/player/MiniPlayerOverlay";
import { PlayerBar } from "./components/player/PlayerBar";
import { Sidebar } from "./components/sidebar/Sidebar";
import { useAppPreferences } from "./hooks/use-app-preferences";
import { useDiscoverFeatureStack } from "./hooks/use-discover-feature-stack";
import { useAppGlobalEffects } from "./hooks/use-app-global-effects";
import { useAppHostPropsStack } from "./hooks/use-app-host-props-stack";
import { useAppInteractionStack } from "./hooks/use-app-interaction-stack";
import { useAppModalHostOptions } from "./hooks/use-app-modal-host-options";
import { useAudioRuntimeStack } from "./hooks/use-audio-runtime-stack";
import { useBrowserSources } from "./hooks/use-browser-sources";
import { useDiscover } from "./hooks/use-discover";
import { usePlayerChromeHostOptions } from "./hooks/use-player-chrome-host-options";
import { useLibraryBrowse } from "./hooks/use-library-browse";
import { useLibraryScan } from "./hooks/use-library-scan";
import { getAlbumKey, getArtistKey } from "./app/library-groups";
import { useMediaSession } from "./hooks/use-media-session";
import { useArtworkAccent } from "./hooks/use-artwork-accent";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useResumePosition } from "./hooks/use-resume-position";
import { useSleepTimer } from "./hooks/use-sleep-timer";
import { useTrackTransitions } from "./hooks/use-track-transitions";
import { useLastfm } from "./hooks/use-lastfm";
import { usePlayHistory } from "./hooks/use-play-history";
import { useFavoritesSync } from "./hooks/use-favorites-sync";
import { favoritesStore, useFavoritesVersion } from "./app/favorites-store";
import { indexByIdentity, mostPlayed, recentlyPlayed, songIdentity } from "./app/history";
import { buildM3u, matchM3uToLibrary, parseM3u, playlistNameFromFile } from "./app/m3u";
import { useListenTracker } from "./hooks/use-listen-tracker";
import { useDiscoverCharts } from "./hooks/use-discover-charts";
import { useAppUpdater } from "./hooks/use-app-updater";
import { sanitizeCrossfadeSeconds } from "./app/transitions";
import { normalizationFactor, sanitizePreampDb } from "./app/normalization";
import { SHORTCUT_SEEK_SECONDS, SHORTCUT_VOLUME_STEP } from "./app/shortcuts";
import { getTrackArtworkSrc, getTrackKey, isTauriRuntime } from "./app/utils";
import { useLibraryRuntimeState } from "./hooks/use-library-runtime-state";
import { useMainStageHostOptions } from "./hooks/use-main-stage-host-options";
import { usePlaybackScrub } from "./hooks/use-playback-scrub";
import { usePlayerShellStack } from "./hooks/use-player-shell-stack";
import { usePlayerControlState } from "./hooks/use-player-control-state";
import { usePlaylistLibraryStack } from "./hooks/use-playlist-library-stack";
import { useSidebarHostOptions } from "./hooks/use-sidebar-host-options";
import { useTrackManagement } from "./hooks/use-track-management";
import "./App.css";
import "./styles/shell.css";
import "./styles/library.css";
import "./styles/now-playing.css";
import "./styles/pages.css";
import "./styles/modals.css";

function App() {
  const directoryInputRef = useRef<HTMLInputElement | null>(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [homePageOpen, setHomePageOpen] = useState(false);
  const [statsPageOpen, setStatsPageOpen] = useState(false);
  const [pageRoot, setPageRoot] = useState<HTMLElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPreloadRef = useRef<HTMLAudioElement | null>(null);
  const isTransitioningTrackRef = useRef(false);
  const displayTrackIndicesRef = useRef<number[]>([]);
  const ignoreNextRowClickRef = useRef(false);
  const librarySortMenuRef = useRef<HTMLDivElement | null>(null);
  const equalizerPresetMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    appLanguage,
    detailPanelOpen,
    detailPanelTab,
    fontPresetId,
    hideOnTray,
    isLibrarySortMenuOpen,
    isThemeModalOpen,
    librarySortKey,
    personalizationView,
    setAppLanguage,
    setDetailPanelOpen,
    setDetailPanelTab,
    setFontPresetId,
    setHideOnTray,
    setIsLibrarySortMenuOpen,
    setIsThemeModalOpen,
    setLibrarySortKey,
    setPersonalizationView,
    setSidebarOpen,
    setThemeColor,
    setThemeHexDraft,
    sidebarOpen,
    themeColor,
    themeHexDraft,
    accentFromArtwork,
    setAccentFromArtwork,
    crossfadeSeconds,
    gapless,
    setCrossfadeSeconds,
    setGapless,
    normalizationMode,
    normalizationPreamp,
    setNormalizationMode,
    setNormalizationPreamp,
    setWatchFolder,
    watchFolder,
  } = useAppPreferences();
  const copy = uiText[appLanguage];
  const {
    activeDuration,
    collectionName,
    currentTrackIndex: storedTrackIndex,
    currentTrackIndexSetExplicitlyRef,
    isBannerVisible,
    isPlaying,
    isScanning,
    playbackTime,
    scanError,
    scannedPath,
    searchQuery,
    setActiveDuration,
    setCollectionName,
    setCurrentTrackIndex,
    setIsBannerVisible,
    setIsPlaying,
    setIsScanning,
    setPlaybackTime,
    setScanError,
    setScannedPath,
    setSearchQuery,
    setStatusMessage,
    setTracks,
    statusMessage,
    syncCurrentTrackIndex,
    tracks,
  } = useLibraryRuntimeState({
    defaultCollectionName: copy.defaultCollectionName,
    initialStatus: copy.initialStatus,
  });
  const {
    activeDiscoverPreviewKey,
    discoverError,
    discoverForYou,
    discoverForYouPageCount,
    discoverPreviewAudioRef,
    discoverPreviewState,
    discoverTab,
    getDiscoverPreviewKey,
    getItunesCover,
    getLastFmImage,
    handleDiscoverPreviewToggle,
    isDiscoverLoading,
    isDiscoverView,
    safeDiscoverForYouPage,
    setDiscoverForYouPage,
    setDiscoverPreviewState,
    setDiscoverTab,
    setIsDiscoverView,
  } = useDiscover({
    discoverErrorMessage: copy.discoverError,
    tracks,
  });
  const {
    equalizerValues,
    isEqualizerEnabled,
    isEqualizerModalOpen,
    isEqualizerPresetMenuOpen,
    selectedEqualizerPresetId,
    setEqualizerValues,
    setIsEqualizerEnabled,
    setIsEqualizerModalOpen,
    setIsEqualizerPresetMenuOpen,
    setSelectedEqualizerPresetId,
    setVolume,
    volume,
  } = usePlayerControlState();
  const { revokeBrowserSources, setUpdatedBrowserSources } = useBrowserSources();
  // ❤ songs in library order (by artist + title, so they survive rescans).
  const favoritesVersion = useFavoritesVersion();
  const favoriteIndices = useMemo(() => {
    void favoritesVersion;
    const ids = new Set(favoritesStore.list().map((entry) => entry.id));
    return tracks.flatMap((track, index) => (ids.has(songIdentity(track.artist, track.title)) ? [index] : []));
  }, [favoritesVersion, tracks]);
  const {
    activeGroup,
    albumGroups,
    artistGroups,
    libraryFilter,
    libraryFilterIndices,
    libraryView,
    setLibraryFilter,
    setLibraryView,
  } = useLibraryBrowse({
    favoriteIndices,
    favoritesLabel: copy.favoritesTitle,
    tracks,
    variousArtistsLabel: copy.variousArtists,
  });

  const {
    beginProgressScrub,
    displayedPlaybackTime,
    handleSeek,
    updateProgressScrub,
  } = usePlaybackScrub({
    activeDuration,
    audioRef,
    playbackTime,
    setPlaybackTime,
  });
  const {
    activatePlaylist,
    activePlaylist,
    activePlaylistId,
    addTrackToPlaylist,
    closePlaylistModal,
    closePlaylistRenameModal,
    closeTrackPlaylistModal,
    createPlaylistFromCurrentSource,
    createPlaylistWithTrack,
    currentTrackIndex,
    deletePlaylist,
    displayTrackRows,
    dragOverPlaylistTrackIndex,
    draggedPlaylistTrackIndex,
    filteredPlaylistCandidateTracks,
    filteredTrackRows,
    handleAppShellClick,
    handlePlaylistTrackDragStart,
    handlePlaylistTrackDrop,
    isPlaylistModalOpen,
    isRenamePlaylistModalOpen,
    isTrackPlaylistModalOpen,
    normalizedSearch,
    openPlaylistEditor,
    openPlaylistMenuId,
    openPlaylistRenameModal,
    openTrackPlaylistModal,
    playbackPlaylist,
    playbackPlaylistId,
    playbackQueue,
    playbackRate,
    playLibraryIndices,
    playlistDraftName,
    playlistHasTrack,
    playlistModalMode,
    playlistSelectionQuery,
    playNextTrack,
    playPlaylistShuffled,
    playPreviousTrack,
    queuePosition,
    queueRows,
    quickPlaylistDraftName,
    removeTrackFromActivePlaylist,
    renamePlaylist,
    renamePlaylistDraft,
    repeatMode,
    returnToLibraryView,
    savedPlaylists,
    selectedPlaylistTrackKeys,
    selectedTrack,
    selectedTrackInViewIndex,
    selectedTrackKey,
    selectTrack,
    setActivePlaylistId,
    setDragOverPlaylistTrackIndex,
    setDraggedPlaylistTrackIndex,
    setOpenPlaylistMenuId,
    setPlaybackPlaylistId,
    setPlaylistDraftName,
    setPlaylistSelectionQuery,
    setQuickPlaylistDraftName,
    setRenamePlaylistDraft,
    setSavedPlaylists,
    shuffleEnabled,
    sourceTracks,
    submitPlaylistCreation,
    toggleShuffle,
    toggleTrackInPlaylistDraft,
    trackPlaylistTarget,
    cyclePlaybackRate,
    cycleRepeatMode,
    handleTrackEnded,
    jumpToQueuePosition,
    moveUpNext,
  } = usePlaylistLibraryStack({
    activeDuration,
    appLanguage,
    audioPreloadRef,
    audioRef,
    collectionName,
    currentTrackIndex: storedTrackIndex,
    currentTrackIndexSetExplicitlyRef,
    displayTrackIndicesRef,
    handleSeek,
    ignoreNextRowClickRef,
    isTransitioningTrackRef,
    libraryFilterIndices,
    librarySortKey,
    playbackTime,
    scannedPath,
    searchQuery,
    setActiveDuration,
    setCurrentTrackIndex,
    setIsDiscoverView,
    setIsPlaying,
    setPlaybackTime,
    setStatusMessage,
    syncCurrentTrackIndex,
    tracks,
  });
  const {
    handleBrowserFolderSelection,
    handleScanFolder,
    scanFolderPathRef,
  } = useLibraryScan({
    activePlaylistId,
    appLanguage,
    collectionName,
    copy,
    currentTrackIndex,
    emptyTrack: getEmptyTrack(appLanguage),
    isPlaying,
    playbackPlaylistId,
    revokeBrowserSources,
    savedPlaylists,
    setActiveDuration,
    setActivePlaylistId,
    setCollectionName,
    setCurrentTrackIndex,
    setIsBannerVisible,
    setIsPlaying,
    setIsScanning,
    setPlaybackPlaylistId,
    setPlaybackTime,
    setScanError,
    setScannedPath,
    setSavedPlaylists,
    setStatusMessage,
    setTracks,
    setUpdatedBrowserSources,
    selectedTrack,
    statusMessage,
  });
  const {
    closeDownloadModal,
    downloadFormat,
    downloadFormatMenuRef,
    downloadQueue,
    downloadUrl,
    ffmpegInstallError,
    ffmpegInstallProgress,
    ffmpegVersion,
    handleAddDownload,
    handleClosePersonalization,
    handleDiscoverNextPage,
    handleDiscoverPreviewEnded,
    handleDiscoverPreviewError,
    handleDiscoverPreviewPause,
    handleDiscoverPreviewPlay,
    handleDiscoverPreviewToggleRequest,
    handleDiscoverPreviousPage,
    handleDonePersonalization,
    handleLanguageChange,
    handleOpenDiscover,
    handleOpenPersonalization,
    handleOpenSettingsTab,
    handlePickSearchResult,
    handlePlaylistMenuToggle,
    handleResetPersonalization,
    handleSearchQueryChange,
    handleThemeColorChange,
    handleThemeHexBlur,
    handleThemeHexDraftChange,
    handleToggleSidebar,
    isDownloadFormatMenuOpen,
    isDownloadModalOpen,
    isFfmpegAvailable,
    isInstallingFfmpeg,
    isInstallingYtdlp,
    isSearchingTracks,
    isYtdlpAvailable,
    openDownloadModal,
    openDownloadModalWithQuery,
    recheckDeps,
    setDownloadFormat,
    setDownloadQueue,
    setDownloadUrl,
    setIsDownloadFormatMenuOpen,
    setTrackSearchResults,
    startInstallFfmpeg,
    startInstallYtdlp,
    trackSearchResults,
    toolingSupport,
    ytdlpInstallError,
    ytdlpInstallProgress,
    ytdlpVersion,
  } = useDiscoverFeatureStack({
    appLanguage,
    discoverForYouPageCount,
    downloadFetchingLabel: copy.downloadFetching,
    handleDiscoverPreviewToggle,
    onDownloadsBatchFinished: async (folderPath: string) => {
      await scanFolderPathRef.current(folderPath, "manual", true);
    },
    personalizationView,
    scannedPath,
    setActivePlaylistId,
    setAppLanguage,
    setDiscoverForYouPage,
    setDiscoverPreviewState,
    setFontPresetId,
    setIsDiscoverView,
    setIsThemeModalOpen,
    setOpenPlaylistMenuId,
    setPersonalizationView,
    setSearchQuery,
    setSidebarOpen,
    setStatusMessage,
    setThemeColor,
    setThemeHexDraft,
    sidebarOpen,
    themeColor,
  });
  const {
    closeEditMetaModal,
    editMetaAlbum,
    editMetaArtist,
    editMetaArtworkError,
    editMetaArtworkInputRef,
    editMetaArtworkPreview,
    editMetaTitle,
    handleArtworkFileChange,
    handleDeleteTrack,
    handleSaveMetadata,
    isEditMetaModalOpen,
    isSavingMeta,
    openEditMetaModal,
    openTrackMenuIndex,
    setEditMetaAlbum,
    setEditMetaArtist,
    setEditMetaTitle,
    setOpenTrackMenuIndex,
    trackMenuRef,
  } = useTrackManagement({
    copy,
    selectedTrackKey,
    setIsPlaying,
    setSavedPlaylists,
    setStatusMessage,
    setTracks,
  });
  // Sleep timer: fade the volume out over ~3 s, then pause and restore it.
  const sleepTimer = useSleepTimer(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) {
      return;
    }

    const startVolume = audio.volume;
    const steps = 30;
    let step = 0;
    const fade = window.setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step >= steps) {
        window.clearInterval(fade);
        audio.pause();
        audio.volume = startVolume;
      }
    }, 100);
  });
  const handleTrackEndedWithSleepTimer = () => {
    if (sleepTimer.consumeEndOfTrack()) {
      setIsPlaying(false);
      return;
    }
    handleTrackEnded();
  };
  // Volume the audio element plays at; the slider keeps the user's own value.
  const outputVolume = volume * normalizationFactor(selectedTrack, normalizationMode, normalizationPreamp);
  const lastfm = useLastfm();
  const playHistory = usePlayHistory();
  useFavoritesSync({ sessionKey: lastfm.sessionKey, userName: lastfm.userName });
  // Home: recently / most played (matched to the library by artist + title).
  const libraryByIdentity = useMemo(() => indexByIdentity(tracks), [tracks]);
  const homeRecentlyPlayed = useMemo(
    () => recentlyPlayed(playHistory.entries, libraryByIdentity, 10),
    [libraryByIdentity, playHistory.entries],
  );
  const homeMostPlayed = useMemo(
    () => mostPlayed(playHistory.entries, libraryByIdentity, Date.now() / 1000 - 30 * 24 * 60 * 60, 10),
    [libraryByIdentity, playHistory.entries],
  );
  // One tracker decides when a play counts; history and Last.fm both use it.
  useListenTracker({
    activeDuration,
    isPlaying,
    onCounted: (play) => {
      playHistory.record(play);
      lastfm.scrobble(play.track, play.duration, play.startedAt);
    },
    onStart: lastfm.nowPlaying,
    playbackTime,
    selectedTrack,
    trackKey: getTrackKey(selectedTrack),
  });
  const updater = useAppUpdater();

  // Folder watcher (Rust): files added/removed/renamed -> quiet rescan that
  // keeps the current song playing.
  useEffect(() => {
    if (!watchFolder || !scannedPath || !isTauriRuntime()) return;
    let cancelled = false;
    let timer = 0;
    let unlisten: (() => void) | null = null;
    void import("@tauri-apps/api/event")
      .then(({ listen }) =>
        listen("library-changed", () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            void scanFolderPathRef.current(scannedPath, "watch", true).catch(() => {});
          }, 800);
        }),
      )
      .then((stop) => {
        if (cancelled) stop();
        else unlisten = stop;
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unlisten?.();
    };
  }, [scanFolderPathRef, scannedPath, watchFolder]);
  const discoverChartsState = useDiscoverCharts({
    active: isDiscoverView && discoverTab === "charts",
    getItunesCover,
    lastfmUserName: lastfm.userName,
    tracks,
  });
  useResumePosition({
    audioRef,
    isPlaying,
    playbackTime,
    selectedTrackPath: selectedTrack.path ?? "",
    setPlaybackTime,
  });
  const artworkAccent = useArtworkAccent(getTrackArtworkSrc(selectedTrack), accentFromArtwork);
  const {
    RepeatIcon,
    VolumeIcon,
    enterMiniMode,
    exitMiniMode,
    handleMiniPlayerMouseDown,
    miniMode,
    miniPinned,
    mpArtistScrolls,
    mpInfoRef,
    mpTitleScrolls,
    selectedEqualizerPresetLabel,
    themeStyle,
    toggleMiniPin,
  } = usePlayerShellStack({
    playerVisualStateOptions: {
      appLanguage,
      equalizerCustomPresetLabel: copy.equalizerCustomPreset,
      fontPresetId,
      repeatMode,
      selectedEqualizerPresetId,
      themeColor: artworkAccent ?? themeColor,
      volume,
    },
    windowStateOptions: {
      selectedArtist: selectedTrack.artist,
      selectedTitle: selectedTrack.title,
    },
  });
  const {
    applyEqualizerPreset,
    attachElementToEqualizer,
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    handleEqualizerToggle,
    isEqualizerSupported,
    togglePlayback,
    updateEqualizerBand,
  } = useAudioRuntimeStack({
    activeDuration,
    appLanguage,
    audioRef,
    currentTrackTitle: selectedTrack.title,
    equalizerUnavailableMessage: copy.equalizerUnavailable,
    equalizerValues,
    isEqualizerEnabled,
    isPlaying,
    isTransitioningTrackRef,
    selectedTrack,
    selectedTrackKey,
    setActiveDuration,
    setEqualizerValues,
    setIsEqualizerEnabled,
    setIsEqualizerPresetMenuOpen,
    setIsPlaying,
    setPlaybackTime,
    setSavedPlaylists,
    setSelectedEqualizerPresetId,
    setStatusMessage,
    setTracks,
  });
  useTrackTransitions({
    advance: handleTrackEnded,
    attachElementToEqualizer,
    audioRef,
    blocked: repeatMode === "one" || sleepTimer.timer.kind === "end-of-track",
    crossfadeSeconds,
    gapless,
    hasNextTrack:
      queuePosition < playbackQueue.length - 1 || (repeatMode === "all" && playbackQueue.length > 1),
    isPlaying,
    selectedTrackPath: selectedTrack.path ?? "",
    volume: outputVolume,
  });
  const {
    handleAddDownloadRequest,
    handleAddTrackToPlaylist,
    handleCloseEqualizerModal,
    handleCreatePlaylistWithTrack,
    handleDeleteTrackRequest,
    handleDownloadFormatMenuToggle,
    handleEnterMiniModeRequest,
    handleEqualizerBandChange,
    handleEqualizerEnabledChange,
    handleEqualizerPresetMenuClose,
    handleEqualizerPresetMenuToggle,
    handleEqualizerPresetSelect,
    handleExitMiniModeRequest,
    handleOpenArtworkPicker,
    handleOpenEqualizerModal,
    handlePlaylistDraftNameChange,
    handlePlaylistSelectionQueryChange,
    handleQuickPlaylistDraftNameChange,
    handleRenamePlaylistDraftChange,
    handleSaveMetadataRequest,
    handleScanFolderRequest,
    handleToggleMiniPinRequest,
    handleTogglePlaybackRequest,
    handleTrackSearchResultsClear,
  } = useAppInteractionStack({
    appAsyncActionsOptions: {
      directoryInputRef,
      editMetaArtworkInputRef,
      enterMiniMode,
      exitMiniMode,
      handleAddDownload,
      handleDeleteTrack,
      handleSaveMetadata,
      handleScanFolder,
      setIsDownloadFormatMenuOpen,
      setTrackSearchResults,
      toggleMiniPin,
      togglePlayback,
    },
    equalizerModalActionsOptions: {
      applyEqualizerPreset,
      handleEqualizerToggle,
      setIsEqualizerModalOpen,
      setIsEqualizerPresetMenuOpen,
      updateEqualizerBand,
    },
    playlistModalHandlersOptions: {
      addTrackToPlaylist,
      createPlaylistWithTrack,
      setPlaylistDraftName,
      setPlaylistSelectionQuery,
      setQuickPlaylistDraftName,
      setRenamePlaylistDraft,
      trackPlaylistTarget,
    },
  });
  const playerChromePropsOptions = usePlayerChromeHostOptions({
    activeDuration,
    appLanguage,
    audioNodesProps: {
      audioPreloadRef,
      audioRef,
      discoverPreviewAudioRef,
      handleAudioError,
      handleAudioLoadedMetadata,
      handleAudioPause,
      handleAudioPlay,
      handleTrackEnded: handleTrackEndedWithSleepTimer,
      onDiscoverPreviewEnded: handleDiscoverPreviewEnded,
      onDiscoverPreviewError: handleDiscoverPreviewError,
      onDiscoverPreviewPause: handleDiscoverPreviewPause,
      onDiscoverPreviewPlay: handleDiscoverPreviewPlay,
    },
    copy,
    displayedPlaybackTime,
    handleMiniPlayerMouseDown,
    isPlaying,
    miniMode,
    miniPinned,
    miniPlayerOverlayProps: {
      onBeginProgressScrub: beginProgressScrub,
      onExitMiniMode: handleExitMiniModeRequest,
      onHandleSeek: handleSeek,
      onPlayNextTrack: playNextTrack,
      onPlayPreviousTrack: playPreviousTrack,
      onToggleMiniPin: handleToggleMiniPinRequest,
      onTogglePlayback: handleTogglePlaybackRequest,
      onUpdateProgressScrub: updateProgressScrub,
    },
    mpArtistScrolls,
    mpInfoRef,
    mpTitleScrolls,
    onPlaybackTimeChange: setPlaybackTime,
    playerBarProps: {
      RepeatIcon,
      VolumeIcon,
      onBeginProgressScrub: beginProgressScrub,
      onCyclePlaybackRate: cyclePlaybackRate,
      onCycleRepeatMode: cycleRepeatMode,
      onPlayNextTrack: playNextTrack,
      onPlayPreviousTrack: playPreviousTrack,
      onSeek: handleSeek,
      onSetVolume: setVolume,
      onTogglePlayback: handleTogglePlaybackRequest,
      onToggleShuffle: toggleShuffle,
      onUpdateProgressScrub: updateProgressScrub,
      playbackRate,
      repeatMode,
      shuffleEnabled,
      volume,
    },
    selectedTrack,
    themeStyle,
  });
  // Downloads, Appearance and Settings used to be modals; they are pages now,
  // derived from the same open flags so every existing entry point (e.g. the
  // Discover "download" button) still lands on the right page.
  const activePage: ShellPage | null = isDownloadModalOpen
    ? "downloads"
    : isThemeModalOpen
      ? personalizationView === "settings"
        ? "settings"
        : "appearance"
      : homePageOpen
        ? "home"
        : statsPageOpen
          ? "stats"
          : null;

  function closePages() {
    setHomePageOpen(false);
    setStatsPageOpen(false);
    setIsThemeModalOpen(false);
    closeDownloadModal();
  }

  const sidebarPropsOptions = useSidebarHostOptions({
    activePlaylistId,
    copy,
    isDiscoverView,
    logoMarkup: dionyxLogoRaw,
    onCreatePlaylist: createPlaylistFromCurrentSource,
    onDeletePlaylist: deletePlaylist,
    onOpenDiscover: () => {
      closePages();
      handleOpenDiscover();
    },
    onOpenLibrary: () => {
      closePages();
      setLibraryFilter(null);
      returnToLibraryView();
    },
    onOpenPlaylistEditor: openPlaylistEditor,
    onOpenPlaylistRename: openPlaylistRenameModal,
    onPlayPlaylistShuffled: playPlaylistShuffled,
    onPlaylistMenuToggle: handlePlaylistMenuToggle,
    onSelectPlaylist: (playlistId) => {
      closePages();
      activatePlaylist(playlistId);
    },
    openPlaylistMenuId,
    savedPlaylists,
    sidebarOpen,
  });
  const appModalPropsOptions = useAppModalHostOptions({
    copy,
    appLanguage,
    downloadFormat,
    downloadFormatMenuRef,
    downloadQueue,
    downloadUrl,
    ffmpegInstallError,
    ffmpegInstallProgress,
    ffmpegVersion,
    isDownloadFormatMenuOpen,
    isDownloadModalOpen,
    isEditMetaModalOpen,
    isEqualizerEnabled,
    isEqualizerModalOpen,
    isEqualizerPresetMenuOpen,
    isEqualizerSupported,
    isFfmpegAvailable,
    isInstallingFfmpeg,
    isInstallingYtdlp,
    isPlaylistModalOpen,
    isRenamePlaylistModalOpen,
    isSavingMeta,
    isSearchingTracks,
    isThemeModalOpen,
    isTrackPlaylistModalOpen,
    isYtdlpAvailable,
    ytdlpInstallError,
    ytdlpInstallProgress,
    ytdlpVersion,
    scannedPath,
    trackSearchResults,
    toolingSupport,
    setDownloadFormat,
    setDownloadQueue,
    setDownloadUrl,
    recheckDeps,
    startInstallFfmpeg,
    startInstallYtdlp,
    handleAddDownloadRequest,
    closeDownloadModal,
    handleDownloadFormatMenuToggle,
    handlePickSearchResult,
    handleTrackSearchResultsClear,
    editMetaAlbum,
    editMetaArtist,
    editMetaArtworkError,
    editMetaArtworkInputRef,
    editMetaArtworkPreview,
    editMetaTitle,
    setEditMetaAlbum,
    setEditMetaArtist,
    setEditMetaTitle,
    handleArtworkFileChange,
    closeEditMetaModal,
    handleOpenArtworkPicker,
    handleSaveMetadataRequest,
    equalizerBandsConfig,
    equalizerPresetMenuRef,
    equalizerValues,
    selectedEqualizerPresetId,
    selectedEqualizerPresetLabel,
    handleCloseEqualizerModal,
    handleEqualizerPresetMenuClose,
    handleEqualizerPresetMenuToggle,
    handleEqualizerPresetSelect,
    handleEqualizerBandChange,
    handleEqualizerEnabledChange,
    fontPresetId,
    hideOnTray,
    personalizationView,
    themeColor,
    themeHexDraft,
    setFontPresetId,
    setHideOnTray,
    setPersonalizationView,
    handleClosePersonalization,
    handleDonePersonalization,
    handleLanguageChange,
    handleOpenSettingsTab,
    handleResetPersonalization,
    handleThemeColorChange,
    handleThemeHexBlur,
    handleThemeHexDraftChange,
    filteredPlaylistCandidateTracks,
    playlistDraftName,
    playlistModalMode,
    playlistSelectionQuery,
    selectedPlaylistTrackKeys,
    closePlaylistModal,
    handlePlaylistDraftNameChange,
    handlePlaylistSelectionQueryChange,
    submitPlaylistCreation,
    toggleTrackInPlaylistDraft,
    closePlaylistRenameModal,
    handleRenamePlaylistDraftChange,
    renamePlaylist,
    renamePlaylistDraft,
    closeTrackPlaylistModal,
    handleAddTrackToPlaylist,
    handleCreatePlaylistWithTrack,
    handleQuickPlaylistDraftNameChange,
    quickPlaylistDraftName,
    savedPlaylists,
    trackPlaylistTarget,
    playlistHasTrack,
  });
  const mainStagePropsOptions = useMainStageHostOptions({
    copy,
    activeDuration,
    activePlaylist,
    activeDiscoverPreviewKey,
    appLanguage,
    directoryInputRef,
    discoverError,
    discoverForYou,
    discoverForYouPageCount,
    discoverPreviewState,
    discoverTab,
    displayTrackRows,
    displayedPlaybackTime,
    dragOverPlaylistTrackIndex,
    draggedPlaylistTrackIndex,
    filteredTrackCount: filteredTrackRows.length,
    getDiscoverPreviewKey,
    getLastFmImage,
    ignoreNextRowClickRef,
    isBannerVisible,
    isDiscoverLoading,
    isDiscoverView,
    isLibrarySortMenuOpen,
    isPlaying,
    isScanning,
    jumpToQueuePosition,
    librarySortKey,
    librarySortMenuRef,
    normalizedSearch,
    onBeginProgressScrub: beginProgressScrub,
    onDeleteTrack: handleDeleteTrackRequest,
    onDirectoryChange: handleBrowserFolderSelection,
    onDiscoverDownload: openDownloadModalWithQuery,
    onDiscoverNextPage: handleDiscoverNextPage,
    onDiscoverPreviousPage: handleDiscoverPreviousPage,
    onDiscoverPreviewToggle: handleDiscoverPreviewToggleRequest,
    onDiscoverTabChange: setDiscoverTab,
    onEditTrack: openEditMetaModal,
    onEnterMiniMode: handleEnterMiniModeRequest,
    onOpenDownload: openDownloadModal,
    onOpenEqualizer: handleOpenEqualizerModal,
    onOpenPersonalization: handleOpenPersonalization,
    onOpenTrackPlaylistModal: openTrackPlaylistModal,
    onPlaylistTrackDragStart: handlePlaylistTrackDragStart,
    onPlaylistTrackDrop: handlePlaylistTrackDrop,
    onRemoveTrackFromActivePlaylist: removeTrackFromActivePlaylist,
    onScanFolder: handleScanFolderRequest,
    onSearchQueryChange: handleSearchQueryChange,
    onSeek: handleSeek,
    onSelectTrack: selectTrack,
    onSetDragOverPlaylistTrackIndex: setDragOverPlaylistTrackIndex,
    onSetIsLibrarySortMenuOpen: setIsLibrarySortMenuOpen,
    onSetLibrarySortKey: setLibrarySortKey,
    onSetOpenTrackMenuIndex: setOpenTrackMenuIndex,
    onToggleSidebar: handleToggleSidebar,
    onUpdateProgressScrub: updateProgressScrub,
    openTrackMenuIndex,
    playbackPlaylist,
    playbackQueue,
    queuePosition,
    queueRows,
    safeDiscoverForYouPage,
    scanError,
    scannedPath,
    searchQuery,
    selectedTrack,
    selectedTrackInViewIndex,
    sourceTrackCount: sourceTracks.length,
    sourceTracks,
    statusMessage,
    supportedAudioAccept,
    trackMenuRef,
  });
  const {
    appModalsHostProps,
    audioNodesProps,
    mainStageProps,
    miniPlayerOverlayProps,
    playerBarProps,
    sidebarProps,
  } = useAppHostPropsStack({
    appModalPropsOptions,
    mainStagePropsOptions,
    playerChromePropsOptions,
    sidebarPropsOptions,
  });
  useMediaSession({
    activeDuration,
    audioRef,
    isPlaying,
    onNext: playNextTrack,
    onPrevious: playPreviousTrack,
    onSeek: handleSeek,
    onTogglePlayback: handleTogglePlaybackRequest,
    selectedTrack,
  });
  useAppGlobalEffects({
    outputVolume,
    activeDuration,
    activePlaylistOpen: Boolean(activePlaylist),
    appLanguage,
    audioRef,
    equalizerPresetMenuRef,
    equalizerValues,
    getItunesCover,
    hideOnTray,
    isEqualizerEnabled,
    isEqualizerPresetMenuOpen,
    isLibrarySortMenuOpen,
    isPlaying,
    isPlaylistModalOpen,
    librarySortMenuRef,
    selectedEqualizerPresetId,
    selectedTrackArtist: selectedTrack.artist,
    selectedTrackPath: selectedTrack.path,
    selectedTrackTitle: selectedTrack.title,
    setDragOverPlaylistTrackIndex,
    setDraggedPlaylistTrackIndex,
    setIsEqualizerPresetMenuOpen,
    setIsLibrarySortMenuOpen,
    setPlaylistSelectionQuery,
    setStatusMessage,
    volume,
  });

  const openLibraryGroup = (kind: "album" | "artist", key: string) => {
    closePages();
    setActivePlaylistId(null);
    setIsDiscoverView(false);
    setLibraryView(kind === "album" ? "albums" : "artists");
    setLibraryFilter({ kind, key });
  };

  const shellValue: ShellContextValue = {
    normalization: {
      mode: normalizationMode,
      onModeChange: setNormalizationMode,
      onPreampChange: (db) => setNormalizationPreamp(sanitizePreampDb(db)),
      preampDb: normalizationPreamp,
    },
    updater,
    discoverCharts: discoverChartsState,
    lastfm,
    playbackTransitions: {
      crossfadeSeconds,
      gapless,
      onCrossfadeSecondsChange: (seconds) => setCrossfadeSeconds(sanitizeCrossfadeSeconds(seconds)),
      onGaplessChange: setGapless,
    },
    sleepTimer: {
      cancel: sleepTimer.cancel,
      remainingMs: sleepTimer.remainingMs,
      startEndOfTrack: sleepTimer.startEndOfTrack,
      startMinutes: sleepTimer.startMinutes,
      timer: sleepTimer.timer,
    },
    accentFromArtwork,
    onToggleAccentFromArtwork: () => setAccentFromArtwork(!accentFromArtwork),
    activePage,
    onOpenHome: () => {
      closePages();
      setHomePageOpen(true);
    },
    onPageRootChange: setPageRoot,
    pageRoot,
    currentTrack: selectedTrack,
    isPlaying,
    onBrowseLibrary: (view) => {
      closePages();
      setActivePlaylistId(null);
      setIsDiscoverView(false);
      setLibraryFilter(null);
      setLibraryView(view);
    },
    onCreatePlaylist: createPlaylistFromCurrentSource,
    onOpenDiscover: () => {
      closePages();
      handleOpenDiscover();
    },
    onOpenPlaylist: (playlistId) => {
      closePages();
      activatePlaylist(playlistId);
    },
    onTogglePlayback: handleTogglePlaybackRequest,
    playlists: savedPlaylists,
    activeGroup,
    albumGroups,
    appLanguage,
    artistGroups,
    libraryFilter,
    libraryView,
    onCloseLibraryGroup: () => setLibraryFilter(null),
    onOpenAlbum: (key) => openLibraryGroup("album", key),
    onOpenArtist: (key) => openLibraryGroup("artist", key),
    favoritesCount: favoriteIndices.length,
    onMoveUpNext: moveUpNext,
    onToggleWatchFolder: () => setWatchFolder(!watchFolder),
    onExportPlaylist: (playlistId) => {
      const playlist = savedPlaylists.find((item) => item.id === playlistId);
      if (!playlist || !isTauriRuntime()) return;
      void (async () => {
        const [{ save }, { invoke }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/api/core")]);
        const path = await save({
          defaultPath: `${playlist.name}.m3u8`,
          filters: [{ extensions: ["m3u8", "m3u"], name: "M3U" }],
        });
        if (!path) return;
        try {
          await invoke("m3u_write", { content: buildM3u(playlist.tracks, path), path });
          setStatusMessage(`${copy.m3uExported}: ${playlistNameFromFile(path)}`);
        } catch (error) {
          setStatusMessage(`${copy.m3uError}: ${String(error)}`);
        }
      })();
    },
    historyEntries: playHistory.entries,
    onOpenStats: () => {
      closePages();
      setStatsPageOpen(true);
    },
    onRescanQuietly: async () => {
      if (scannedPath) await scanFolderPathRef.current(scannedPath, "watch", true).catch(() => {});
    },
    onImportPlaylist: () => {
      if (!isTauriRuntime()) return;
      void (async () => {
        const [{ open }, { invoke }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/api/core")]);
        const path = await open({ filters: [{ extensions: ["m3u8", "m3u"], name: "M3U" }], multiple: false });
        if (typeof path !== "string") return;
        try {
          const text = await invoke<string>("m3u_read", { path });
          const locations = parseM3u(text, path);
          const { matched } = matchM3uToLibrary(locations, tracks);
          if (matched.length === 0) {
            setStatusMessage(copy.m3uNothingFound);
            return;
          }
          const name = playlistNameFromFile(path);
          setSavedPlaylists((current) => [
            ...current,
            {
              createdAt: Date.now(),
              id: `m3u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              name,
              sourceCollectionName: collectionName,
              sourcePath: scannedPath,
              tracks: matched,
            },
          ]);
          setStatusMessage(`${copy.m3uImported} "${name}": ${matched.length} / ${locations.length}`);
        } catch (error) {
          setStatusMessage(`${copy.m3uError}: ${String(error)}`);
        }
      })();
    },
    watchFolder,
    libraryTracks: tracks,
    mostPlayed: homeMostPlayed,
    recentlyPlayed: homeRecentlyPlayed,
    onOpenFavorites: () => {
      closePages();
      setActivePlaylistId(null);
      setIsDiscoverView(false);
      setLibraryView("songs");
      setLibraryFilter({ kind: "favorites", key: "favorites" });
    },
    onOpenTrackAlbum: (track) => openLibraryGroup("album", getAlbumKey(track)),
    onOpenTrackArtist: (track) => openLibraryGroup("artist", getArtistKey(track)),
    onPlayLibraryIndices: (indices, shuffle) => {
      setActivePlaylistId(null);
      playLibraryIndices(indices, shuffle);
    },
    nowPlayingOpen,
    onCloseNowPlaying: () => setNowPlayingOpen(false),
    onOpenNowPlaying: () => {
      if (selectedTrack.path || selectedTrack.source) {
        setNowPlayingOpen(true);
      }
    },
    onSetLibraryView: (view) => {
      setLibraryFilter(null);
      setLibraryView(view);
    },
    activeDownloadCount: downloadQueue.filter(
      (item) => item.status === "fetching" || item.status === "pending" || item.status === "downloading",
    ).length,
    collectionName,
    copy,
    detailPanelOpen,
    detailPanelTab,
    isNoticeVisible: isBannerVisible,
    isScanning,
    libraryTrackCount: tracks.length,
    onDismissNotice: () => setIsBannerVisible(false),
    onEnterMiniMode: handleEnterMiniModeRequest,
    onOpenAppearance: () => {
      closePages();
      handleOpenPersonalization("theme");
    },
    onOpenDownloads: () => {
      closePages();
      openDownloadModal();
    },
    onOpenEqualizer: handleOpenEqualizerModal,
    onOpenSettings: () => {
      closePages();
      handleOpenPersonalization("settings");
      handleOpenSettingsTab();
    },
    onScanFolder: handleScanFolderRequest,
    onShowDetailPanel: (tab: DetailPanelTab) => {
      if (detailPanelOpen && detailPanelTab === tab) {
        setDetailPanelOpen(false);
        return;
      }

      setDetailPanelTab(tab);
      setDetailPanelOpen(true);
    },
    onToggleDetailPanel: () => setDetailPanelOpen(!detailPanelOpen),
    scannedPath,
    statusMessage,
  };

  const lastAudibleVolumeRef = useRef(volume > 0 ? volume : 0.7);
  if (volume > 0) {
    lastAudibleVolumeRef.current = volume;
  }

  const seekBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) {
      return;
    }
    handleSeek(Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration));
  };

  useKeyboardShortcuts({
    "cycle-repeat": cycleRepeatMode,
    "focus-search": () => {
      const search = document.getElementById("track-search") as HTMLInputElement | null;
      search?.focus();
      search?.select();
    },
    "next-track": playNextTrack,
    "previous-track": playPreviousTrack,
    "seek-back": () => seekBy(-SHORTCUT_SEEK_SECONDS),
    "seek-forward": () => seekBy(SHORTCUT_SEEK_SECONDS),
    "toggle-lyrics": () => shellValue.onShowDetailPanel("lyrics"),
    "toggle-mute": () => setVolume(volume > 0 ? 0 : lastAudibleVolumeRef.current),
    "toggle-favorite": () => {
      if (selectedTrack.path || selectedTrack.source) favoritesStore.toggle(selectedTrack);
    },
    "toggle-now-playing": () => (nowPlayingOpen ? setNowPlayingOpen(false) : shellValue.onOpenNowPlaying()),
    "toggle-playback": () => void handleTogglePlaybackRequest(),
    "toggle-queue": () => shellValue.onShowDetailPanel("queue"),
    "toggle-shuffle": toggleShuffle,
    "volume-down": () => setVolume(Math.max(0, Math.round((volume - SHORTCUT_VOLUME_STEP) * 100) / 100)),
    "volume-up": () => setVolume(Math.min(1, Math.round((volume + SHORTCUT_VOLUME_STEP) * 100) / 100)),
  }, !miniMode);

  return (
    <ShellProvider value={shellValue}>
      <MiniPlayerOverlay
        {...miniPlayerOverlayProps}
      />

    <main
      className={`app-shell${sidebarOpen ? "" : " app-shell--no-sidebar"}`}
      onClick={(event) => {
        handleAppShellClick(event.target as HTMLElement);
      }}
      style={{ ...themeStyle, ...(miniMode ? { display: "none" } : {}) }}
    >
      <TitleBar />

      <AudioNodes
        {...audioNodesProps}
      />

      <Sidebar {...sidebarProps} />

      <AppMainStageHost {...mainStageProps} />

      <AppModalsHost {...appModalsHostProps} />

      <PlayerBar
        {...playerBarProps}
      />

      {nowPlayingOpen && (selectedTrack.path || selectedTrack.source) ? (
        <NowPlayingView
          RepeatIcon={RepeatIcon}
          activeDuration={activeDuration}
          displayedPlaybackTime={displayedPlaybackTime}
          isPlaying={isPlaying}
          onBeginProgressScrub={beginProgressScrub}
          onCycleRepeatMode={cycleRepeatMode}
          onPlayNextTrack={playNextTrack}
          onPlayPreviousTrack={playPreviousTrack}
          onSeek={handleSeek}
          onTogglePlayback={handleTogglePlaybackRequest}
          onToggleShuffle={toggleShuffle}
          onUpdateProgressScrub={updateProgressScrub}
          repeatMode={repeatMode}
          selectedTrack={selectedTrack}
          shuffleEnabled={shuffleEnabled}
        />
      ) : null}

      <NoticeToast />
    </main>
    </ShellProvider>
  );
}

export default App;
