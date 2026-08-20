import { downloadToolsCopy } from "../app/constants";
import { getTrackKey } from "../app/utils";
import { useAppHostPropsStack } from "./use-app-host-props-stack";

type HostStackOptions = Parameters<typeof useAppHostPropsStack>[0];
type AppModalOptions = HostStackOptions["appModalPropsOptions"];

type UseAppModalHostOptionsInput = {
  copy: AppModalOptions["copy"];
  appLanguage: AppModalOptions["downloadModalProps"]["appLanguage"];
  downloadFormat: AppModalOptions["downloadModalProps"]["downloadFormat"];
  downloadFormatMenuRef: AppModalOptions["downloadModalProps"]["downloadFormatMenuRef"];
  downloadQueue: AppModalOptions["downloadModalProps"]["downloadQueue"];
  downloadUrl: AppModalOptions["downloadModalProps"]["downloadUrl"];
  ffmpegInstallError: AppModalOptions["downloadModalProps"]["ffmpegInstallError"];
  ffmpegInstallProgress: AppModalOptions["downloadModalProps"]["ffmpegInstallProgress"];
  ffmpegVersion: AppModalOptions["downloadModalProps"]["ffmpegVersion"];
  isDownloadFormatMenuOpen: AppModalOptions["downloadModalProps"]["isDownloadFormatMenuOpen"];
  isDownloadModalOpen: AppModalOptions["downloadModalProps"]["isOpen"];
  isEditMetaModalOpen: AppModalOptions["editMetadataModalProps"]["isOpen"];
  isEqualizerEnabled: AppModalOptions["equalizerModalProps"]["isEqualizerEnabled"];
  isEqualizerModalOpen: AppModalOptions["equalizerModalProps"]["isOpen"];
  isEqualizerPresetMenuOpen: AppModalOptions["equalizerModalProps"]["isEqualizerPresetMenuOpen"];
  isEqualizerSupported: AppModalOptions["equalizerModalProps"]["isEqualizerSupported"];
  isFfmpegAvailable: AppModalOptions["downloadModalProps"]["isFfmpegAvailable"];
  isInstallingFfmpeg: AppModalOptions["downloadModalProps"]["isInstallingFfmpeg"];
  isInstallingYtdlp: AppModalOptions["downloadModalProps"]["isInstallingYtdlp"];
  isPlaylistModalOpen: AppModalOptions["playlistModalProps"]["isOpen"];
  isRenamePlaylistModalOpen: AppModalOptions["renamePlaylistModalProps"]["isOpen"];
  isSavingMeta: AppModalOptions["editMetadataModalProps"]["isSavingMeta"];
  isSearchingTracks: AppModalOptions["downloadModalProps"]["isSearchingTracks"];
  isThemeModalOpen: AppModalOptions["personalizationModalProps"]["isOpen"];
  isTrackPlaylistModalOpen: AppModalOptions["trackPlaylistModalProps"]["isOpen"];
  isYtdlpAvailable: AppModalOptions["downloadModalProps"]["isYtdlpAvailable"];
  ytdlpInstallError: AppModalOptions["downloadModalProps"]["ytdlpInstallError"];
  ytdlpInstallProgress: AppModalOptions["downloadModalProps"]["ytdlpInstallProgress"];
  ytdlpVersion: AppModalOptions["downloadModalProps"]["ytdlpVersion"];
  scannedPath: AppModalOptions["downloadModalProps"]["scannedPath"];
  trackSearchResults: AppModalOptions["downloadModalProps"]["trackSearchResults"];
  toolingSupport: AppModalOptions["downloadModalProps"]["toolingSupport"];
  setDownloadFormat: AppModalOptions["downloadModalProps"]["onDownloadFormatChange"];
  setDownloadQueue: AppModalOptions["downloadModalProps"]["setDownloadQueue"];
  setDownloadUrl: AppModalOptions["downloadModalProps"]["onDownloadUrlChange"];
  recheckDeps: AppModalOptions["downloadModalProps"]["onRecheckDeps"];
  startInstallFfmpeg: AppModalOptions["downloadModalProps"]["onFfmpegInstall"];
  startInstallYtdlp: AppModalOptions["downloadModalProps"]["onYtdlpInstall"];
  handleAddDownloadRequest: AppModalOptions["downloadModalProps"]["onAddDownload"];
  closeDownloadModal: AppModalOptions["downloadModalProps"]["onClose"];
  handleDownloadFormatMenuToggle: AppModalOptions["downloadModalProps"]["onDownloadFormatMenuToggle"];
  handlePickSearchResult: AppModalOptions["downloadModalProps"]["onPickSearchResult"];
  handleTrackSearchResultsClear: AppModalOptions["downloadModalProps"]["onTrackSearchResultsClear"];
  editMetaAlbum: AppModalOptions["editMetadataModalProps"]["editMetaAlbum"];
  editMetaArtist: AppModalOptions["editMetadataModalProps"]["editMetaArtist"];
  editMetaArtworkError: AppModalOptions["editMetadataModalProps"]["editMetaArtworkError"];
  editMetaArtworkInputRef: AppModalOptions["editMetadataModalProps"]["editMetaArtworkInputRef"];
  editMetaArtworkPreview: AppModalOptions["editMetadataModalProps"]["editMetaArtworkPreview"];
  editMetaTitle: AppModalOptions["editMetadataModalProps"]["editMetaTitle"];
  setEditMetaAlbum: AppModalOptions["editMetadataModalProps"]["onAlbumChange"];
  setEditMetaArtist: AppModalOptions["editMetadataModalProps"]["onArtistChange"];
  setEditMetaTitle: AppModalOptions["editMetadataModalProps"]["onTitleChange"];
  handleArtworkFileChange: AppModalOptions["editMetadataModalProps"]["onArtworkChange"];
  closeEditMetaModal: AppModalOptions["editMetadataModalProps"]["onClose"];
  handleOpenArtworkPicker: AppModalOptions["editMetadataModalProps"]["onOpenArtworkPicker"];
  handleSaveMetadataRequest: AppModalOptions["editMetadataModalProps"]["onSave"];
  equalizerBandsConfig: AppModalOptions["equalizerModalProps"]["equalizerBandsConfig"];
  equalizerPresetMenuRef: AppModalOptions["equalizerModalProps"]["equalizerPresetMenuRef"];
  equalizerValues: AppModalOptions["equalizerModalProps"]["equalizerValues"];
  selectedEqualizerPresetId: AppModalOptions["equalizerModalProps"]["selectedEqualizerPresetId"];
  selectedEqualizerPresetLabel: AppModalOptions["equalizerModalProps"]["selectedEqualizerPresetLabel"];
  handleCloseEqualizerModal: AppModalOptions["equalizerModalProps"]["onClose"];
  handleEqualizerPresetMenuClose: AppModalOptions["equalizerModalProps"]["onPresetMenuClose"];
  handleEqualizerPresetMenuToggle: AppModalOptions["equalizerModalProps"]["onPresetMenuToggle"];
  handleEqualizerPresetSelect: AppModalOptions["equalizerModalProps"]["onPresetSelect"];
  handleEqualizerBandChange: AppModalOptions["equalizerModalProps"]["onSliderChange"];
  handleEqualizerEnabledChange: AppModalOptions["equalizerModalProps"]["onToggle"];
  fontPresetId: AppModalOptions["personalizationModalProps"]["fontPresetId"];
  hideOnTray: AppModalOptions["personalizationModalProps"]["hideOnTray"];
  personalizationView: AppModalOptions["personalizationModalProps"]["personalizationView"];
  themeColor: AppModalOptions["personalizationModalProps"]["themeColor"];
  themeHexDraft: AppModalOptions["personalizationModalProps"]["themeHexDraft"];
  setFontPresetId: AppModalOptions["personalizationModalProps"]["onFontPresetChange"];
  setHideOnTray: AppModalOptions["personalizationModalProps"]["onHideOnTrayChange"];
  setPersonalizationView: AppModalOptions["personalizationModalProps"]["onPersonalizationViewChange"];
  handleClosePersonalization: AppModalOptions["personalizationModalProps"]["onClose"];
  handleDonePersonalization: AppModalOptions["personalizationModalProps"]["onDone"];
  handleLanguageChange: AppModalOptions["personalizationModalProps"]["onLanguageChange"];
  handleOpenSettingsTab: AppModalOptions["personalizationModalProps"]["onOpenSettingsTab"];
  handleResetPersonalization: AppModalOptions["personalizationModalProps"]["onReset"];
  handleThemeColorChange: AppModalOptions["personalizationModalProps"]["onThemeColorChange"];
  handleThemeHexBlur: AppModalOptions["personalizationModalProps"]["onThemeHexBlur"];
  handleThemeHexDraftChange: AppModalOptions["personalizationModalProps"]["onThemeHexDraftChange"];
  filteredPlaylistCandidateTracks: AppModalOptions["playlistModalProps"]["filteredPlaylistCandidateTracks"];
  playlistDraftName: AppModalOptions["playlistModalProps"]["playlistDraftName"];
  playlistModalMode: AppModalOptions["playlistModalProps"]["playlistModalMode"];
  playlistSelectionQuery: AppModalOptions["playlistModalProps"]["playlistSelectionQuery"];
  selectedPlaylistTrackKeys: AppModalOptions["playlistModalProps"]["selectedPlaylistTrackKeys"];
  closePlaylistModal: AppModalOptions["playlistModalProps"]["onClose"];
  handlePlaylistDraftNameChange: AppModalOptions["playlistModalProps"]["onPlaylistDraftNameChange"];
  handlePlaylistSelectionQueryChange: AppModalOptions["playlistModalProps"]["onPlaylistSelectionQueryChange"];
  submitPlaylistCreation: AppModalOptions["playlistModalProps"]["onSubmit"];
  toggleTrackInPlaylistDraft: AppModalOptions["playlistModalProps"]["onToggleTrack"];
  closePlaylistRenameModal: AppModalOptions["renamePlaylistModalProps"]["onClose"];
  handleRenamePlaylistDraftChange: AppModalOptions["renamePlaylistModalProps"]["onDraftChange"];
  renamePlaylist: AppModalOptions["renamePlaylistModalProps"]["onSubmit"];
  renamePlaylistDraft: AppModalOptions["renamePlaylistModalProps"]["renamePlaylistDraft"];
  closeTrackPlaylistModal: AppModalOptions["trackPlaylistModalProps"]["onClose"];
  handleAddTrackToPlaylist: AppModalOptions["trackPlaylistModalProps"]["onAddTrackToPlaylist"];
  handleCreatePlaylistWithTrack: AppModalOptions["trackPlaylistModalProps"]["onCreateAndSave"];
  handleQuickPlaylistDraftNameChange: AppModalOptions["trackPlaylistModalProps"]["onQuickPlaylistDraftNameChange"];
  quickPlaylistDraftName: AppModalOptions["trackPlaylistModalProps"]["quickPlaylistDraftName"];
  savedPlaylists: AppModalOptions["trackPlaylistModalProps"]["savedPlaylists"];
  trackPlaylistTarget: AppModalOptions["trackPlaylistModalProps"]["targetTrack"];
  playlistHasTrack: AppModalOptions["trackPlaylistModalProps"]["trackAlreadyInPlaylist"];
};

export function useAppModalHostOptions({
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
}: UseAppModalHostOptionsInput): AppModalOptions {
  return {
    copy,
    downloadModalProps: {
      appLanguage,
      downloadFormat,
      downloadFormatMenuRef,
      downloadQueue,
      downloadUrl,
      ffmpegInstallError,
      ffmpegInstallProgress,
      ffmpegVersion,
      isDownloadFormatMenuOpen,
      isFfmpegAvailable,
      isInstallingFfmpeg,
      isInstallingYtdlp,
      isOpen: isDownloadModalOpen,
      isSearchingTracks,
      isYtdlpAvailable,
      onAddDownload: handleAddDownloadRequest,
      onClose: closeDownloadModal,
      onDownloadFormatChange: setDownloadFormat,
      onDownloadFormatMenuToggle: handleDownloadFormatMenuToggle,
      onDownloadUrlChange: setDownloadUrl,
      onFfmpegInstall: startInstallFfmpeg,
      onPickSearchResult: handlePickSearchResult,
      onRecheckDeps: recheckDeps,
      onTrackSearchResultsClear: handleTrackSearchResultsClear,
      onYtdlpInstall: startInstallYtdlp,
      scannedPath,
      setDownloadQueue,
      trackSearchResults,
      toolingSupport,
      ytdlpInstallError,
      ytdlpInstallProgress,
      ytdlpVersion,
    },
    editMetadataModalProps: {
      editMetaAlbum,
      editMetaArtist,
      editMetaArtworkError,
      editMetaArtworkInputRef,
      editMetaArtworkPreview,
      editMetaTitle,
      isOpen: isEditMetaModalOpen,
      isSavingMeta,
      onAlbumChange: setEditMetaAlbum,
      onArtistChange: setEditMetaArtist,
      onArtworkChange: handleArtworkFileChange,
      onClose: closeEditMetaModal,
      onOpenArtworkPicker: handleOpenArtworkPicker,
      onSave: handleSaveMetadataRequest,
      onTitleChange: setEditMetaTitle,
    },
    equalizerModalProps: {
      appLanguage,
      equalizerBandsConfig,
      equalizerPresetMenuRef,
      equalizerValues,
      isEqualizerEnabled,
      isEqualizerPresetMenuOpen,
      isEqualizerSupported,
      isOpen: isEqualizerModalOpen,
      onClose: handleCloseEqualizerModal,
      onPresetMenuClose: handleEqualizerPresetMenuClose,
      onPresetMenuToggle: handleEqualizerPresetMenuToggle,
      onPresetSelect: handleEqualizerPresetSelect,
      onSliderChange: handleEqualizerBandChange,
      onToggle: handleEqualizerEnabledChange,
      selectedEqualizerPresetId,
      selectedEqualizerPresetLabel,
    },
    personalizationModalProps: {
      appLanguage,
      ffmpegInstallError,
      ffmpegInstallProgress,
      ffmpegVersion,
      fontPresetId,
      hideOnTray,
      isFfmpegAvailable,
      isInstallingFfmpeg,
      isInstallingYtdlp,
      isOpen: isThemeModalOpen,
      isYtdlpAvailable,
      onClose: handleClosePersonalization,
      onDone: handleDonePersonalization,
      onFfmpegInstall: startInstallFfmpeg,
      onFontPresetChange: setFontPresetId,
      onHideOnTrayChange: setHideOnTray,
      onLanguageChange: handleLanguageChange,
      onOpenSettingsTab: handleOpenSettingsTab,
      onPersonalizationViewChange: setPersonalizationView,
      onRecheckDeps: recheckDeps,
      onReset: handleResetPersonalization,
      onThemeColorChange: handleThemeColorChange,
      onThemeHexBlur: handleThemeHexBlur,
      onThemeHexDraftChange: handleThemeHexDraftChange,
      onYtdlpInstall: startInstallYtdlp,
      personalizationView,
      themeColor,
      themeHexDraft,
      toolingSupport,
      ytdlpInstallError,
      ytdlpInstallProgress,
      ytdlpVersion,
    },
    playlistModalProps: {
      filteredPlaylistCandidateTracks,
      getTrackKey,
      isOpen: isPlaylistModalOpen,
      onClose: closePlaylistModal,
      onPlaylistDraftNameChange: handlePlaylistDraftNameChange,
      onPlaylistSelectionQueryChange: handlePlaylistSelectionQueryChange,
      onSubmit: submitPlaylistCreation,
      onToggleTrack: toggleTrackInPlaylistDraft,
      playlistDraftName,
      playlistModalMode,
      playlistSelectionQuery,
      selectedPlaylistTrackKeys,
    },
    renamePlaylistModalProps: {
      isOpen: isRenamePlaylistModalOpen,
      onClose: closePlaylistRenameModal,
      onDraftChange: handleRenamePlaylistDraftChange,
      onSubmit: renamePlaylist,
      renamePlaylistDraft,
    },
    toolsCopy: downloadToolsCopy,
    trackPlaylistModalProps: {
      isOpen: isTrackPlaylistModalOpen,
      onAddTrackToPlaylist: handleAddTrackToPlaylist,
      onClose: closeTrackPlaylistModal,
      onCreateAndSave: handleCreatePlaylistWithTrack,
      onQuickPlaylistDraftNameChange: handleQuickPlaylistDraftNameChange,
      quickPlaylistDraftName,
      savedPlaylists,
      targetTrack: trackPlaylistTarget,
      trackAlreadyInPlaylist: playlistHasTrack,
    },
  };
}
