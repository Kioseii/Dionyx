import { getLibrarySortLabel } from "../app/ui";
import { startMarquee, stopMarquee } from "../app/utils";
import { useAppHostPropsStack } from "./use-app-host-props-stack";

type HostStackOptions = Parameters<typeof useAppHostPropsStack>[0];
type MainStageOptions = HostStackOptions["mainStagePropsOptions"];

type UseMainStageHostOptionsInput = {
  copy: MainStageOptions["copy"];
  activeDuration: MainStageOptions["detailPanelProps"]["activeDuration"];
  activePlaylist: MainStageOptions["detailPanelProps"]["activePlaylist"];
  activeDiscoverPreviewKey: MainStageOptions["discoverPanelProps"]["activeDiscoverPreviewKey"];
  appLanguage: MainStageOptions["libraryPanelProps"]["appLanguage"];
  directoryInputRef: MainStageOptions["topBarProps"]["directoryInputRef"];
  discoverCharts: MainStageOptions["discoverPanelProps"]["discoverCharts"];
  discoverError: MainStageOptions["discoverPanelProps"]["discoverError"];
  discoverForYou: MainStageOptions["discoverPanelProps"]["discoverForYou"];
  discoverForYouPageCount: MainStageOptions["discoverPanelProps"]["discoverForYouPageCount"];
  discoverPreviewState: MainStageOptions["discoverPanelProps"]["discoverPreviewState"];
  discoverTab: MainStageOptions["discoverPanelProps"]["discoverTab"];
  displayTrackRows: MainStageOptions["libraryPanelProps"]["displayTrackRows"];
  displayedPlaybackTime: MainStageOptions["detailPanelProps"]["displayedPlaybackTime"];
  dragOverPlaylistTrackIndex: MainStageOptions["libraryPanelProps"]["dragOverPlaylistTrackIndex"];
  draggedPlaylistTrackIndex: MainStageOptions["libraryPanelProps"]["draggedPlaylistTrackIndex"];
  filteredTrackCount: MainStageOptions["libraryStatusBannerProps"]["filteredTrackCount"];
  getDiscoverPreviewKey: MainStageOptions["discoverPanelProps"]["getDiscoverPreviewKey"];
  getLastFmImage: MainStageOptions["discoverPanelProps"]["getLastFmImage"];
  ignoreNextRowClickRef: MainStageOptions["libraryPanelProps"]["ignoreNextRowClickRef"];
  isBannerVisible: MainStageOptions["libraryStatusBannerProps"]["isBannerVisible"];
  isDiscoverLoading: MainStageOptions["discoverPanelProps"]["isDiscoverLoading"];
  isDiscoverView: MainStageOptions["isDiscoverView"];
  isLibrarySortMenuOpen: MainStageOptions["libraryPanelProps"]["isLibrarySortMenuOpen"];
  isPlaying: MainStageOptions["detailPanelProps"]["isPlaying"];
  isScanning: MainStageOptions["topBarProps"]["isScanning"];
  jumpToQueuePosition: MainStageOptions["detailPanelProps"]["onJumpToQueuePosition"];
  librarySortKey: MainStageOptions["libraryPanelProps"]["librarySortKey"];
  librarySortMenuRef: MainStageOptions["libraryPanelProps"]["librarySortMenuRef"];
  normalizedSearch: MainStageOptions["libraryPanelProps"]["normalizedSearch"];
  onBeginProgressScrub: MainStageOptions["detailPanelProps"]["onBeginProgressScrub"];
  onDeleteTrack: MainStageOptions["libraryPanelProps"]["onDeleteTrack"];
  onDirectoryChange: MainStageOptions["topBarProps"]["onDirectoryChange"];
  onDiscoverDownload: MainStageOptions["discoverPanelProps"]["onDownload"];
  onDiscoverNextPage: MainStageOptions["discoverPanelProps"]["onNextPage"];
  onDiscoverPreviousPage: MainStageOptions["discoverPanelProps"]["onPreviousPage"];
  onDiscoverPreviewToggle: MainStageOptions["discoverPanelProps"]["onPreviewToggle"];
  onDiscoverTabChange: MainStageOptions["discoverPanelProps"]["onTabChange"];
  onEditTrack: MainStageOptions["libraryPanelProps"]["onEditTrack"];
  onEnterMiniMode: MainStageOptions["detailPanelProps"]["onEnterMiniMode"];
  onOpenDownload: MainStageOptions["topBarProps"]["onOpenDownload"];
  onOpenEqualizer: MainStageOptions["detailPanelProps"]["onOpenEqualizer"];
  onOpenPersonalization: MainStageOptions["topBarProps"]["onOpenPersonalization"];
  onOpenTrackPlaylistModal: MainStageOptions["detailPanelProps"]["onOpenTrackPlaylistModal"];
  onPlaylistTrackDragStart: MainStageOptions["libraryPanelProps"]["onPlaylistTrackDragStart"];
  onPlaylistTrackDrop: MainStageOptions["libraryPanelProps"]["onPlaylistTrackDrop"];
  onRemoveTrackFromActivePlaylist: MainStageOptions["detailPanelProps"]["onRemoveTrackFromActivePlaylist"];
  onScanFolder: MainStageOptions["topBarProps"]["onScanFolder"];
  onSearchQueryChange: MainStageOptions["topBarProps"]["onSearchQueryChange"];
  onSeek: MainStageOptions["detailPanelProps"]["onSeek"];
  onSelectTrack: MainStageOptions["libraryPanelProps"]["onSelectTrack"];
  onSetDragOverPlaylistTrackIndex: MainStageOptions["libraryPanelProps"]["onSetDragOverPlaylistTrackIndex"];
  onSetIsLibrarySortMenuOpen: MainStageOptions["libraryPanelProps"]["onSetIsLibrarySortMenuOpen"];
  onSetLibrarySortKey: MainStageOptions["libraryPanelProps"]["onSetLibrarySortKey"];
  onSetOpenTrackMenuIndex: MainStageOptions["libraryPanelProps"]["onSetOpenTrackMenuIndex"];
  onToggleSidebar: MainStageOptions["topBarProps"]["onToggleSidebar"];
  onUpdateProgressScrub: MainStageOptions["detailPanelProps"]["onUpdateProgressScrub"];
  openTrackMenuIndex: MainStageOptions["libraryPanelProps"]["openTrackMenuIndex"];
  playbackPlaylist: MainStageOptions["detailPanelProps"]["playbackPlaylist"];
  playbackQueue: MainStageOptions["detailPanelProps"]["playbackQueue"];
  queuePosition: MainStageOptions["detailPanelProps"]["queuePosition"];
  queueRows: MainStageOptions["detailPanelProps"]["queueRows"];
  safeDiscoverForYouPage: MainStageOptions["discoverPanelProps"]["safeDiscoverForYouPage"];
  scanError: MainStageOptions["libraryStatusBannerProps"]["scanError"];
  scannedPath: MainStageOptions["libraryStatusBannerProps"]["scannedPath"];
  searchQuery: MainStageOptions["topBarProps"]["searchQuery"];
  selectedTrack: MainStageOptions["detailPanelProps"]["selectedTrack"];
  selectedTrackInViewIndex: MainStageOptions["detailPanelProps"]["selectedTrackInViewIndex"];
  sourceTrackCount: MainStageOptions["libraryStatusBannerProps"]["sourceTrackCount"];
  sourceTracks: MainStageOptions["libraryPanelProps"]["sourceTracks"];
  statusMessage: MainStageOptions["libraryStatusBannerProps"]["statusMessage"];
  supportedAudioAccept: MainStageOptions["topBarProps"]["supportedAudioAccept"];
  trackMenuRef: MainStageOptions["libraryPanelProps"]["trackMenuRef"];
};

export function useMainStageHostOptions({
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
  filteredTrackCount,
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
  onBeginProgressScrub,
  onDeleteTrack,
  onDirectoryChange,
  onDiscoverDownload,
  onDiscoverNextPage,
  onDiscoverPreviousPage,
  onDiscoverPreviewToggle,
  onDiscoverTabChange,
  onEditTrack,
  onEnterMiniMode,
  onOpenDownload,
  onOpenEqualizer,
  onOpenPersonalization,
  onOpenTrackPlaylistModal,
  onPlaylistTrackDragStart,
  onPlaylistTrackDrop,
  onRemoveTrackFromActivePlaylist,
  onScanFolder,
  onSearchQueryChange,
  onSeek,
  onSelectTrack,
  onSetDragOverPlaylistTrackIndex,
  onSetIsLibrarySortMenuOpen,
  onSetLibrarySortKey,
  onSetOpenTrackMenuIndex,
  onToggleSidebar,
  onUpdateProgressScrub,
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
  sourceTrackCount,
  sourceTracks,
  statusMessage,
  supportedAudioAccept,
  trackMenuRef,
}: UseMainStageHostOptionsInput): MainStageOptions {
  return {
    copy,
    detailPanelProps: {
      activeDuration,
      activePlaylist,
      displayedPlaybackTime,
      isPlaying,
      onBeginProgressScrub,
      onEnterMiniMode,
      onJumpToQueuePosition: jumpToQueuePosition,
      onOpenEqualizer,
      onOpenTrackPlaylistModal,
      onRemoveTrackFromActivePlaylist,
      onSeek,
      onUpdateProgressScrub,
      playbackPlaylist,
      playbackQueue,
      queuePosition,
      queueRows,
      selectedTrack,
      selectedTrackInViewIndex,
    },
    discoverPanelProps: {
      activeDiscoverPreviewKey,
      discoverCharts,
      discoverError,
      discoverForYou,
      discoverForYouPageCount,
      discoverPreviewState,
      discoverTab,
      getDiscoverPreviewKey,
      getLastFmImage,
      isDiscoverLoading,
      onDownload: onDiscoverDownload,
      onNextPage: onDiscoverNextPage,
      onPreviousPage: onDiscoverPreviousPage,
      onPreviewToggle: onDiscoverPreviewToggle,
      onTabChange: onDiscoverTabChange,
      safeDiscoverForYouPage,
    },
    isDiscoverView,
    libraryPanelProps: {
      activePlaylist,
      appLanguage,
      displayTrackRows,
      dragOverPlaylistTrackIndex,
      draggedPlaylistTrackIndex,
      getLibrarySortLabel,
      ignoreNextRowClickRef,
      isLibrarySortMenuOpen,
      librarySortKey,
      librarySortMenuRef,
      normalizedSearch,
      onDeleteTrack,
      onEditTrack,
      onPlaylistTrackDragStart,
      onPlaylistTrackDrop,
      onSelectTrack,
      onSetDragOverPlaylistTrackIndex,
      onSetIsLibrarySortMenuOpen,
      onSetLibrarySortKey,
      onSetOpenTrackMenuIndex,
      onStartMarquee: startMarquee,
      onStopMarquee: stopMarquee,
      openTrackMenuIndex,
      searchQuery,
      selectedTrackInViewIndex,
      sourceTracks,
      trackMenuRef,
    },
    libraryStatusBannerProps: {
      filteredTrackCount,
      isBannerVisible,
      normalizedSearch,
      scanError,
      scannedPath,
      sourceTrackCount,
      statusMessage,
    },
    topBarProps: {
      directoryInputRef,
      isDiscoverView,
      isScanning,
      onDirectoryChange,
      onOpenDownload,
      onOpenPersonalization,
      onScanFolder,
      onSearchQueryChange,
      onToggleSidebar,
      searchQuery,
      supportedAudioAccept,
    },
  };
}
