import type { LibraryTrack } from "./types";
import { getTrackKey } from "./utils";

/**
 * Resolves which entry of `playbackTracks` is the current track.
 *
 * `currentTrackIndex` is trusted when it was set on purpose since the last
 * render (`indexWasSetExplicitly`). Otherwise the list may have changed under a
 * stable index (playlist edited or reordered, a track deleted, a rescan), so the
 * previously selected track is followed by its key instead of letting playback
 * jump to whatever now sits at that index.
 */
export function resolveSelectedTrackIndex(
  playbackTracks: LibraryTrack[],
  currentTrackIndex: number,
  previousSelectedKey: string | null,
  indexWasSetExplicitly: boolean,
) {
  if (indexWasSetExplicitly || !previousSelectedKey) {
    return currentTrackIndex;
  }

  const candidate = playbackTracks[currentTrackIndex];

  if (candidate && getTrackKey(candidate) === previousSelectedKey) {
    return currentTrackIndex;
  }

  const followedIndex = playbackTracks.findIndex(
    (track) => getTrackKey(track) === previousSelectedKey,
  );

  return followedIndex >= 0 ? followedIndex : currentTrackIndex;
}
