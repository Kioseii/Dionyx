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

    setTracks((previousTracks) =>
      previousTracks.map((track) =>
        getTrackKey(track) === trackKey && track.duration !== formatted
          ? { ...track, duration: formatted }
          : track,
      ),
    );
    setSavedPlaylists((previousPlaylists) =>
      previousPlaylists.map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.map((track) =>
          getTrackKey(track) === trackKey && track.duration !== formatted
            ? { ...track, duration: formatted }
            : track,
        ),
      })),
    );
  }

  return {
    updateSelectedTrackDuration,
  };
}
