import type { LibraryTrack, SavedPlaylist } from "../app/types";
import { formatTime, getTrackKey } from "../app/utils";

type UseTrackDurationSyncOptions = {
  selectedTrack: LibraryTrack;
  setSavedPlaylists: (
    value: SavedPlaylist[] | ((previousPlaylists: SavedPlaylist[]) => SavedPlaylist[]),
  ) => void;
  setTracks: (value: LibraryTrack[] | ((previousTracks: LibraryTrack[]) => LibraryTrack[])) => void;
};

export function useTrackDurationSync({
  selectedTrack,
  setSavedPlaylists,
  setTracks,
}: UseTrackDurationSyncOptions) {
  function updateSelectedTrackDuration(seconds: number) {
    const formatted = formatTime(seconds);
    const trackKey = getTrackKey(selectedTrack);

    // Return the previous arrays when nothing changes, so state consumers (and
    // the playlist persistence effect) are not triggered on every track load.
    const withDuration = (list: LibraryTrack[]) => {
      let changed = false;
      const next = list.map((track) => {
        if (getTrackKey(track) === trackKey && track.duration !== formatted) {
          changed = true;
          return { ...track, duration: formatted };
        }

        return track;
      });

      return changed ? next : list;
    };

    setTracks((previousTracks) => withDuration(previousTracks));
    setSavedPlaylists((previousPlaylists) => {
      let changed = false;
      const next = previousPlaylists.map((playlist) => {
        const tracks = withDuration(playlist.tracks);

        if (tracks === playlist.tracks) {
          return playlist;
        }

        changed = true;
        return { ...playlist, tracks };
      });

      return changed ? next : previousPlaylists;
    });
  }

  return {
    updateSelectedTrackDuration,
  };
}
