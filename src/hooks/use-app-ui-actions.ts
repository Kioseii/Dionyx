import { storageKeys } from "../app/constants";
import type { PersonalizationView } from "../app/types";
import { sanitizePlainTextInput, writeStoredValue } from "../app/utils";

type UseAppUiActionsOptions = {
  discoverForYouPageCount: number;
  handleDiscoverPreviewToggle: (artistName: string, trackName: string) => Promise<void> | void;
  setActivePlaylistId: (value: string | null) => void;
  setDiscoverForYouPage: (
    value: number | ((currentValue: number) => number),
  ) => void;
  setIsDiscoverView: (value: boolean) => void;
  setIsThemeModalOpen: (value: boolean) => void;
  setOpenPlaylistMenuId: (
    value: string | null | ((currentValue: string | null) => string | null),
  ) => void;
  setPersonalizationView: (value: PersonalizationView) => void;
  setSearchQuery: (value: string) => void;
  setSidebarOpen: (value: boolean) => void;
  sidebarOpen: boolean;
};

export function useAppUiActions({
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
}: UseAppUiActionsOptions) {
  function handleOpenDiscover() {
    setIsDiscoverView(true);
    setActivePlaylistId(null);
  }

  function handleOpenPersonalization(view: PersonalizationView = "theme") {
    setPersonalizationView(view);
    setIsThemeModalOpen(true);
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(sanitizePlainTextInput(value, 120));
  }

  function handleToggleSidebar() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    writeStoredValue(storageKeys.sidebarOpen, String(next));
  }

  function handlePlaylistMenuToggle(playlistId: string) {
    setOpenPlaylistMenuId((currentId) => (currentId === playlistId ? null : playlistId));
  }

  function handleDiscoverNextPage() {
    setDiscoverForYouPage((currentValue) =>
      Math.min(currentValue + 1, discoverForYouPageCount - 1),
    );
  }

  function handleDiscoverPreviousPage() {
    setDiscoverForYouPage((currentValue) => Math.max(currentValue - 1, 0));
  }

  function handleDiscoverPreviewToggleRequest(artistName: string, trackName: string) {
    void handleDiscoverPreviewToggle(artistName, trackName);
  }

  return {
    handleDiscoverNextPage,
    handleOpenDiscover,
    handleOpenPersonalization,
    handleDiscoverPreviewToggleRequest,
    handleDiscoverPreviousPage,
    handlePlaylistMenuToggle,
    handleSearchQueryChange,
    handleToggleSidebar,
  };
}
