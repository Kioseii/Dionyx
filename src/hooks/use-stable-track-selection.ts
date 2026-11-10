import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { resolveSelectedTrackIndex } from "../app/track-selection";
import type { LibraryTrack } from "../app/types";
import { getTrackKey } from "../app/utils";

type UseStableTrackSelectionOptions = {
  currentTrackIndex: number;
  indexSetExplicitlyRef: MutableRefObject<boolean>;
  playbackTracks: LibraryTrack[];
  syncCurrentTrackIndex: (value: number) => void;
};

/**
 * Returns the index of the track that is really current in `playbackTracks`.
 *
 * When the list changes under an unchanged index (playlist reordered or edited,
 * a track deleted, a rescan), the playing track is followed by its key in the
 * same render, so the audio source never flips to the neighbour; the stored
 * index is then corrected after commit.
 */
export function useStableTrackSelection({
  currentTrackIndex,
  indexSetExplicitlyRef,
  playbackTracks,
  syncCurrentTrackIndex,
}: UseStableTrackSelectionOptions) {
  const previousSelectedKeyRef = useRef<string | null>(null);
  const effectiveIndex = resolveSelectedTrackIndex(
    playbackTracks,
    currentTrackIndex,
    previousSelectedKeyRef.current,
    indexSetExplicitlyRef.current,
  );
  const selectedTrack = playbackTracks[effectiveIndex];
  const selectedKey = selectedTrack ? getTrackKey(selectedTrack) : null;

  useEffect(() => {
    indexSetExplicitlyRef.current = false;
    previousSelectedKeyRef.current = selectedKey;

    if (effectiveIndex !== currentTrackIndex) {
      syncCurrentTrackIndex(effectiveIndex);
    }
  });

  return effectiveIndex;
}
