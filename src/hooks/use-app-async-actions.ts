import type { RefObject } from "react";
import type { LibraryTrack } from "../app/types";

type UseAppAsyncActionsOptions = {
  directoryInputRef: RefObject<HTMLInputElement | null>;
  editMetaArtworkInputRef: RefObject<HTMLInputElement | null>;
  enterMiniMode: () => Promise<void> | void;
  exitMiniMode: () => Promise<void> | void;
  handleAddDownload: () => Promise<void> | void;
  handleDeleteTrack: (track: LibraryTrack) => Promise<void> | void;
  handleSaveMetadata: () => Promise<void> | void;
  handleScanFolder: (directoryInputRef: RefObject<HTMLInputElement | null>) => Promise<void> | void;
  setIsDownloadFormatMenuOpen: (value: boolean | ((currentValue: boolean) => boolean)) => void;
  setTrackSearchResults: (value: null) => void;
  toggleMiniPin: () => Promise<void> | void;
  togglePlayback: () => Promise<void> | void;
};

export function useAppAsyncActions({
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
}: UseAppAsyncActionsOptions) {
  function handleTogglePlaybackRequest() {
    void togglePlayback();
  }

  function handleEnterMiniModeRequest() {
    void enterMiniMode();
  }

  function handleExitMiniModeRequest() {
    void exitMiniMode();
  }

  function handleToggleMiniPinRequest() {
    void toggleMiniPin();
  }

  function handleScanFolderRequest() {
    void handleScanFolder(directoryInputRef);
  }

  function handleDeleteTrackRequest(track: LibraryTrack) {
    void handleDeleteTrack(track);
  }

  function handleOpenArtworkPicker() {
    editMetaArtworkInputRef.current?.click();
  }

  function handleSaveMetadataRequest() {
    void handleSaveMetadata();
  }

  function handleAddDownloadRequest() {
    void handleAddDownload();
  }

  function handleDownloadFormatMenuToggle() {
    setIsDownloadFormatMenuOpen((currentValue) => !currentValue);
  }

  function handleTrackSearchResultsClear() {
    setTrackSearchResults(null);
  }

  return {
    handleAddDownloadRequest,
    handleDeleteTrackRequest,
    handleDownloadFormatMenuToggle,
    handleEnterMiniModeRequest,
    handleExitMiniModeRequest,
    handleOpenArtworkPicker,
    handleSaveMetadataRequest,
    handleScanFolderRequest,
    handleToggleMiniPinRequest,
    handleTogglePlaybackRequest,
    handleTrackSearchResultsClear,
  };
}
