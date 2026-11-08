import { useRef, useState } from "react";
import dionyxLogoRaw from "./assets/dionyx-logo.svg?raw";
import { equalizerBandsConfig, supportedAudioAccept } from "./app/constants";
import { getEmptyTrack, uiText } from "./app/ui";
import { AppModalsHost } from "./components/modals/AppModalsHost";
import { AppMainStageHost } from "./components/layout/AppMainStageHost";
import { NoticeToast } from "./components/layout/NoticeToast";
import { NowPlayingView } from "./components/player/NowPlayingView";
import { type DetailPanelTab, ShellProvider, type ShellContextValue } from "./components/layout/ShellContext";
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

function App() {
  const directoryInputRef = useRef<HTMLInputElement | null>(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
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
    discoverCharts,
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
  const {
    activeGroup,
    albumGroups,
    artistGroups,
    libraryFilter,
    libraryFilterIndices,
    libraryView,
    setLibraryFilter,
    setLibraryView,
  } = useLibraryBrowse({ tracks, variousArtistsLabel: copy.variousArtists });

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
      themeColor,
      volume,
    },
    windowStateOptions: {
      selectedArtist: selectedTrack.artist,
      selectedTitle: selectedTrack.title,
    },
  });
  const {
    applyEqualizerPreset,
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
      handleTrackEnded,
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
  const sidebarPropsOptions = useSidebarHostOptions({
    activePlaylistId,
    copy,
    isDiscoverView,
    logoMarkup: dionyxLogoRaw,
    onCreatePlaylist: createPlaylistFromCurrentSource,
    onDeletePlaylist: deletePlaylist,
    onOpenDiscover: handleOpenDiscover,
    onOpenLibrary: () => {
      setLibraryFilter(null);
      returnToLibraryView();
    },
    onOpenPlaylistEditor: openPlaylistEditor,
    onOpenPlaylistRename: openPlaylistRenameModal,
    onPlayPlaylistShuffled: playPlaylistShuffled,
    onPlaylistMenuToggle: handlePlaylistMenuToggle,
    onSelectPlaylist: activatePlaylist,
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
    discoverCharts,
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
    setActivePlaylistId(null);
    setIsDiscoverView(false);
    setLibraryView(kind === "album" ? "albums" : "artists");
    setLibraryFilter({ kind, key });
  };

  const shellValue: ShellContextValue = {
    activeGroup,
    albumGroups,
    appLanguage,
    artistGroups,
    libraryFilter,
    libraryView,
    onCloseLibraryGroup: () => setLibraryFilter(null),
    onOpenAlbum: (key) => openLibraryGroup("album", key),
    onOpenArtist: (key) => openLibraryGroup("artist", key),
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
    onOpenAppearance: () => handleOpenPersonalization("theme"),
    onOpenDownloads: openDownloadModal,
    onOpenEqualizer: handleOpenEqualizerModal,
    onOpenSettings: () => {
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
