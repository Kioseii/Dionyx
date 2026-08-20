import { startMarquee, stopMarquee } from "../app/utils";
import { useAppHostPropsStack } from "./use-app-host-props-stack";

type HostStackOptions = Parameters<typeof useAppHostPropsStack>[0];
type PlayerChromeOptions = HostStackOptions["playerChromePropsOptions"];

type UsePlayerChromeHostOptionsInput = {
  activeDuration: PlayerChromeOptions["activeDuration"];
  appLanguage: PlayerChromeOptions["appLanguage"];
  audioNodesProps: Omit<PlayerChromeOptions["audioNodesProps"], "onTimeUpdate">;
  copy: PlayerChromeOptions["copy"];
  displayedPlaybackTime: PlayerChromeOptions["displayedPlaybackTime"];
  handleMiniPlayerMouseDown: PlayerChromeOptions["handleMiniPlayerMouseDown"];
  isPlaying: PlayerChromeOptions["isPlaying"];
  miniMode: PlayerChromeOptions["miniMode"];
  miniPinned: PlayerChromeOptions["miniPinned"];
  miniPlayerOverlayProps: Omit<
    PlayerChromeOptions["miniPlayerOverlayProps"],
    | "onBeginProgressScrub"
    | "onUpdateProgressScrub"
  > & Pick<
    PlayerChromeOptions["miniPlayerOverlayProps"],
    "onBeginProgressScrub" | "onUpdateProgressScrub"
  >;
  mpArtistScrolls: PlayerChromeOptions["mpArtistScrolls"];
  mpInfoRef: PlayerChromeOptions["mpInfoRef"];
  mpTitleScrolls: PlayerChromeOptions["mpTitleScrolls"];
  onPlaybackTimeChange: PlayerChromeOptions["onPlaybackTimeChange"];
  playerBarProps: Omit<
    PlayerChromeOptions["playerBarProps"],
    "onStartMarquee" | "onStopMarquee"
  >;
  selectedTrack: PlayerChromeOptions["selectedTrack"];
  themeStyle: PlayerChromeOptions["themeStyle"];
};

export function usePlayerChromeHostOptions({
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
}: UsePlayerChromeHostOptionsInput): PlayerChromeOptions {
  return {
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
    playerBarProps: {
      ...playerBarProps,
      onStartMarquee: startMarquee,
      onStopMarquee: stopMarquee,
    },
    selectedTrack,
    themeStyle,
  };
}
