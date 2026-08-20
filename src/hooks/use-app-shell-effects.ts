import { useEffect } from "react";
import type { RefObject } from "react";

type UseAppShellEffectsOptions = {
  activePlaylistOpen: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaylistModalOpen: boolean;
  setIsLibrarySortMenuOpen: (value: boolean) => void;
  setPlaylistSelectionQuery: (value: string) => void;
  volume: number;
};

export function useAppShellEffects({
  activePlaylistOpen,
  audioRef,
  isPlaylistModalOpen,
  setIsLibrarySortMenuOpen,
  setPlaylistSelectionQuery,
  volume,
}: UseAppShellEffectsOptions) {
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
  }, [audioRef, volume]);

  useEffect(() => {
    if (activePlaylistOpen) {
      setIsLibrarySortMenuOpen(false);
    }
  }, [activePlaylistOpen, setIsLibrarySortMenuOpen]);

  useEffect(() => {
    if (!isPlaylistModalOpen) {
      setPlaylistSelectionQuery("");
    }
  }, [isPlaylistModalOpen, setPlaylistSelectionQuery]);
}
