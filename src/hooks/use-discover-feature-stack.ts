import type { AppLanguage, DiscoverPreviewState, PersonalizationView } from "../app/types";
import { useAppFeatureStack } from "./use-app-feature-stack";

type UseDiscoverFeatureStackOptions = {
  appLanguage: AppLanguage;
  discoverForYouPageCount: number;
  downloadFetchingLabel: string;
  handleDiscoverPreviewToggle: (artistName: string, trackName: string) => Promise<void> | void;
  onDownloadsBatchFinished: (folderPath: string) => Promise<void> | void;
  personalizationView: PersonalizationView;
  scannedPath: string | null;
  setActivePlaylistId: (value: string | null) => void;
  setAppLanguage: (value: AppLanguage) => void;
  setFontPresetId: (value: string) => void;
  setDiscoverForYouPage: (
    value: number | ((currentValue: number) => number),
  ) => void;
  setDiscoverPreviewState: (
    value:
      | DiscoverPreviewState
      | ((currentValue: DiscoverPreviewState) => DiscoverPreviewState),
  ) => void;
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

export function useDiscoverFeatureStack({
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
}: UseDiscoverFeatureStackOptions) {
  return useAppFeatureStack({
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
  });
}
