import type { CSSProperties, ComponentProps, RefObject } from "react";
import type { AppLanguage, LibraryTrack } from "../app/types";
import { AudioNodes } from "../components/player/AudioNodes";
import { MiniPlayerOverlay } from "../components/player/MiniPlayerOverlay";
import { PlayerBar } from "../components/player/PlayerBar";

type AudioNodesProps = ComponentProps<typeof AudioNodes>;
type MiniPlayerOverlayProps = ComponentProps<typeof MiniPlayerOverlay>;
type PlayerBarProps = ComponentProps<typeof PlayerBar>;

type SharedCopy = PlayerBarProps["copy"];

type UsePlayerChromePropsOptions = {
  activeDuration: number;
  appLanguage: AppLanguage;
  audioNodesProps: Omit<AudioNodesProps, "onTimeUpdate">;
  copy: SharedCopy;
  displayedPlaybackTime: number;
  handleMiniPlayerMouseDown: MiniPlayerOverlayProps["handleMiniPlayerMouseDown"];
  isPlaying: boolean;
  miniMode: boolean;
  miniPinned: boolean;
  miniPlayerOverlayProps: Omit<
    MiniPlayerOverlayProps,
    | "activeDuration"
    | "displayedPlaybackTime"
    | "handleMiniPlayerMouseDown"
    | "isPlaying"
    | "miniMode"
    | "miniPinned"
    | "mpArtistScrolls"
    | "mpInfoRef"
    | "mpTitleScrolls"
    | "selectedTrack"
    | "themeStyle"
  >;
  mpArtistScrolls: boolean;
  mpInfoRef: RefObject<HTMLDivElement | null>;
  mpTitleScrolls: boolean;
  onPlaybackTimeChange: (value: number) => void;
  playerBarProps: Omit<
    PlayerBarProps,
    | "activeDuration"
    | "appLanguage"
    | "copy"
    | "displayedPlaybackTime"
    | "isPlaying"
    | "selectedTrack"
  >;
  selectedTrack: LibraryTrack;
  themeStyle: CSSProperties;
};

export function usePlayerChromeProps({
  activeDuration,
  appLanguage,
  audioNodesProps,
  copy,
  displayedPlaybackTime,
  handleMiniPlayerMouseDown,
  isPlaying,
  miniMode,
  miniPinned,
  miniPlayerOverlayProps,
  mpArtistScrolls,
  mpInfoRef,
  mpTitleScrolls,
  onPlaybackTimeChange,
  playerBarProps,
  selectedTrack,
  themeStyle,
}: UsePlayerChromePropsOptions) {
  const resolvedAudioNodesProps: AudioNodesProps = {
    ...audioNodesProps,
    onTimeUpdate: (event) => {
      onPlaybackTimeChange(event.currentTarget.currentTime);
    },
  };

  const resolvedMiniPlayerOverlayProps: MiniPlayerOverlayProps = {
    activeDuration,
    displayedPlaybackTime,
    handleMiniPlayerMouseDown,
    isPlaying,
    miniMode,
    miniPinned,
    mpArtistScrolls,
    mpInfoRef,
    mpTitleScrolls,
    selectedTrack,
    themeStyle,
    ...miniPlayerOverlayProps,
  };

  const resolvedPlayerBarProps: PlayerBarProps = {
    activeDuration,
    appLanguage,
    copy,
    displayedPlaybackTime,
    isPlaying,
    selectedTrack,
    ...playerBarProps,
  };

  return {
    audioNodesProps: resolvedAudioNodesProps,
    miniPlayerOverlayProps: resolvedMiniPlayerOverlayProps,
    playerBarProps: resolvedPlayerBarProps,
  };
}
