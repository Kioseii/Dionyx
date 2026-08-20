import type { DiscoverPreviewState } from "../app/types";

type UseDiscoverPreviewAudioOptions = {
  setDiscoverPreviewState: (
    value:
      | DiscoverPreviewState
      | ((currentValue: DiscoverPreviewState) => DiscoverPreviewState),
  ) => void;
};

export function useDiscoverPreviewAudio({
  setDiscoverPreviewState,
}: UseDiscoverPreviewAudioOptions) {
  function handleDiscoverPreviewEnded() {
    setDiscoverPreviewState("paused");
  }

  function handleDiscoverPreviewError() {
    setDiscoverPreviewState("error");
  }

  function handleDiscoverPreviewPause() {
    setDiscoverPreviewState((currentValue) =>
      currentValue === "loading" ? currentValue : "paused",
    );
  }

  function handleDiscoverPreviewPlay() {
    setDiscoverPreviewState("playing");
  }

  return {
    handleDiscoverPreviewEnded,
    handleDiscoverPreviewError,
    handleDiscoverPreviewPause,
    handleDiscoverPreviewPlay,
  };
}
