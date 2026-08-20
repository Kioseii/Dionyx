import { useEffect } from "react";
import type { RefObject } from "react";

type UseDismissibleMenuOptions = {
  containerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
};

function useDismissibleMenu({
  containerRef,
  isOpen,
  onClose,
}: UseDismissibleMenuOptions) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [containerRef, isOpen, onClose]);
}

type UseOverlayControlsOptions = {
  equalizerPresetMenuRef: RefObject<HTMLDivElement | null>;
  isEqualizerPresetMenuOpen: boolean;
  isLibrarySortMenuOpen: boolean;
  librarySortMenuRef: RefObject<HTMLDivElement | null>;
  setDragOverPlaylistTrackIndex: (value: number | null) => void;
  setDraggedPlaylistTrackIndex: (value: number | null) => void;
  setIsEqualizerPresetMenuOpen: (value: boolean) => void;
  setIsLibrarySortMenuOpen: (value: boolean) => void;
};

export function useOverlayControls({
  equalizerPresetMenuRef,
  isEqualizerPresetMenuOpen,
  isLibrarySortMenuOpen,
  librarySortMenuRef,
  setDragOverPlaylistTrackIndex,
  setDraggedPlaylistTrackIndex,
  setIsEqualizerPresetMenuOpen,
  setIsLibrarySortMenuOpen,
}: UseOverlayControlsOptions) {
  useDismissibleMenu({
    containerRef: librarySortMenuRef,
    isOpen: isLibrarySortMenuOpen,
    onClose: () => {
      setIsLibrarySortMenuOpen(false);
    },
  });

  useDismissibleMenu({
    containerRef: equalizerPresetMenuRef,
    isOpen: isEqualizerPresetMenuOpen,
    onClose: () => {
      setIsEqualizerPresetMenuOpen(false);
    },
  });

  useEffect(() => {
    function handlePointerRelease() {
      setDraggedPlaylistTrackIndex(null);
      setDragOverPlaylistTrackIndex(null);
    }

    window.addEventListener("mouseup", handlePointerRelease);

    return () => {
      window.removeEventListener("mouseup", handlePointerRelease);
    };
  }, [setDragOverPlaylistTrackIndex, setDraggedPlaylistTrackIndex]);
}
