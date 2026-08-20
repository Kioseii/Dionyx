type UseLibraryActionsOptions = {
  appLanguage: "es" | "en";
  handlePlaylistTrackDropBase: (targetIndex: number) => void;
  ignoreNextRowClickRef: { current: boolean };
  setActivePlaylistId: (value: string | null) => void;
  setIsDiscoverView: (value: boolean) => void;
  setOpenPlaylistMenuId: (value: string | null) => void;
  setStatusMessage: (value: string) => void;
};

export function useLibraryActions({
  appLanguage,
  handlePlaylistTrackDropBase,
  ignoreNextRowClickRef,
  setActivePlaylistId,
  setIsDiscoverView,
  setOpenPlaylistMenuId,
  setStatusMessage,
}: UseLibraryActionsOptions) {
  function handlePlaylistTrackDrop(targetIndex: number) {
    handlePlaylistTrackDropBase(targetIndex);
    ignoreNextRowClickRef.current = true;
  }

  function returnToLibraryView() {
    setActivePlaylistId(null);
    setOpenPlaylistMenuId(null);
    setIsDiscoverView(false);
    setStatusMessage(
      appLanguage === "es"
        ? "Volviste a tu biblioteca completa."
        : "You returned to your full library.",
    );
  }

  function handleAppShellClick(target: HTMLElement) {
    if (!target.closest(".playlist-options-shell")) {
      setOpenPlaylistMenuId(null);
    }
  }

  return {
    handleAppShellClick,
    handlePlaylistTrackDrop,
    returnToLibraryView,
  };
}
