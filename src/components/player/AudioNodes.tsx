import type { RefObject } from "react";

type AudioNodesProps = {
  audioPreloadRef: RefObject<HTMLAudioElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  discoverPreviewAudioRef: RefObject<HTMLAudioElement | null>;
  handleAudioError: () => void;
  handleAudioLoadedMetadata: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
  handleAudioPause: () => void;
  handleAudioPlay: () => void;
  handleTrackEnded: () => void;
  onDiscoverPreviewError: () => void;
  onDiscoverPreviewPause: () => void;
  onDiscoverPreviewPlay: () => void;
  onDiscoverPreviewEnded: () => void;
  onTimeUpdate: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
};

export function AudioNodes({
  audioPreloadRef,
  audioRef,
  discoverPreviewAudioRef,
  handleAudioError,
  handleAudioLoadedMetadata,
  handleAudioPause,
  handleAudioPlay,
  handleTrackEnded,
  onDiscoverPreviewEnded,
  onDiscoverPreviewError,
  onDiscoverPreviewPause,
  onDiscoverPreviewPlay,
  onTimeUpdate,
}: AudioNodesProps) {
  return (
    <>
      <audio ref={audioPreloadRef} preload="auto" style={{ display: "none" }} />
      <audio
        ref={discoverPreviewAudioRef}
        onEnded={onDiscoverPreviewEnded}
        onError={onDiscoverPreviewError}
        onPause={onDiscoverPreviewPause}
        onPlay={onDiscoverPreviewPlay}
        preload="none"
        style={{ display: "none" }}
      />

      <audio
        ref={audioRef}
        onEnded={handleTrackEnded}
        onError={handleAudioError}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onPause={handleAudioPause}
        onPlay={handleAudioPlay}
        onTimeUpdate={onTimeUpdate}
      />
    </>
  );
}
