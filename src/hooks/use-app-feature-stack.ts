import type { AppLanguage, DiscoverPreviewState, PersonalizationView } from "../app/types";
import { useAppUiActions } from "./use-app-ui-actions";
import { useDiscoverPreviewAudio } from "./use-discover-preview-audio";
import { useDownloads } from "./use-downloads";
import { usePersonalizationControls } from "./use-personalization-controls";

type UseAppFeatureStackOptions = {
  appLanguage: AppLanguage;
  discoverForYouPageCount: number;
  downloadFetchingLabel: string;
  handleDiscoverPreviewToggle: (artistName: string, trackName: string) => Promise<void> | void;
  onDownloadsBatchFinished: (folderPath: string) => Promise<void> | void;
  personalizationView: PersonalizationView;
  scannedPath: string | null;
  setActivePlaylistId: (value: string | null) => void;
  setAppLanguage: (value: AppLanguage) => void;
  setDiscoverForYouPage: (
    value: number | ((currentValue: number) => number),
  ) => void;
  setDiscoverPreviewState: (
    value:
      | DiscoverPreviewState
      | ((currentValue: DiscoverPreviewState) => DiscoverPreviewState),
  ) => void;
  setFontPresetId: (value: string) => void;
  setIsDiscoverView: (value: boolean) => void;
  setIsThemeModalOpen: (value: boolean) => void;
  setOpenPlaylistMenuId: (
    value: string | null | ((currentValue: string | null) => string | null),
  ) => void;
  setPersonalizationView: (value: PersonalizationView) => void;
  setSearchQuery: (value: string) => void;
  setSidebarOpen: (value: boolean) => void;
  setStatusMessage: (value: string) => void;
  setThemeColor: (value: string) => void;
  setThemeHexDraft: (value: string) => void;
  sidebarOpen: boolean;
  themeColor: string;
};

export function useAppFeatureStack({
  appLanguage,
  discoverForYouPageCount,
  downloadFetchingLabel,
  handleDiscoverPreviewToggle,
  onDownloadsBatchFinished,
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
}: UseAppFeatureStackOptions) {
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
    handlePickSearchResult,
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
  } = useDownloads({
    appLanguage,
    copy: {
      downloadFetching: downloadFetchingLabel,
    },
    onBatchFinished: onDownloadsBatchFinished,
    scannedPath,
    setStatusMessage,
  });
  const {
    handleClosePersonalization,
    handleDonePersonalization,
    handleLanguageChange,
    handleOpenSettingsTab,
    handleResetPersonalization,
    handleThemeColorChange,
    handleThemeHexBlur,
    handleThemeHexDraftChange,
  } = usePersonalizationControls({
    isFfmpegAvailable,
    isYtdlpAvailable,
    personalizationView,
    recheckDeps,
    setAppLanguage,
    setFontPresetId,
    setIsThemeModalOpen,
    setPersonalizationView,
    setStatusMessage,
    setThemeColor,
    setThemeHexDraft,
    themeColor,
  });
  const {
    handleDiscoverNextPage,
    handleOpenDiscover,
    handleOpenPersonalization,
    handleDiscoverPreviewToggleRequest,
    handleDiscoverPreviousPage,
    handlePlaylistMenuToggle,
    handleSearchQueryChange,
    handleToggleSidebar,
  } = useAppUiActions({
    discoverForYouPageCount,
    handleDiscoverPreviewToggle,
    setActivePlaylistId,
    setDiscoverForYouPage,
    setIsDiscoverView,
    setIsThemeModalOpen,
    setOpenPlaylistMenuId,
    setPersonalizationView,
    setSearchQuery,
    setSidebarOpen,
    sidebarOpen,
  });
  const {
    handleDiscoverPreviewEnded,
    handleDiscoverPreviewError,
    handleDiscoverPreviewPause,
    handleDiscoverPreviewPlay,
  } = useDiscoverPreviewAudio({
    setDiscoverPreviewState,
  });

  return {
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
  };
}
