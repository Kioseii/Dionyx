import type { MutableRefObject } from "react";
import type { AppLanguage, LibrarySortKey, LibraryTrack, SavedPlaylist } from "../app/types";
import { getEmptyTrack } from "../app/ui";
import { getTrackKey, parseTrackDuration } from "../app/utils";

type UseLibraryViewModelOptions = {
  activePlaylist: SavedPlaylist | null;
  appLanguage: AppLanguage;
  currentTrackIndex: number;
  displayTrackIndicesRef: MutableRefObject<number[]>;
  playbackQueue: number[];
  playbackTracks: LibraryTrack[];
  searchQuery: string;
  sourceTracks: LibraryTrack[];
  librarySortKey: LibrarySortKey;
};

export function useLibraryViewModel({
  activePlaylist,
  appLanguage,
  currentTrackIndex,
  displayTrackIndicesRef,
  librarySortKey,
  playbackQueue,
  playbackTracks,
  searchQuery,
  sourceTracks,
}: UseLibraryViewModelOptions) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTrackRows = sourceTracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        track.title,
        track.artist,
        track.album,
        track.format,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

  const displayTrackRows = (() => {
    if (activePlaylist) {
      return filteredTrackRows;
    }

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });
    const sortedRows = [...filteredTrackRows];

    sortedRows.sort((left, right) => {
      switch (librarySortKey) {
        case "artist": {
          const artistComparison = collator.compare(left.track.artist, right.track.artist);

          return artistComparison !== 0
            ? artistComparison
            : collator.compare(left.track.title, right.track.title);
        }
        case "album": {
          const albumComparison = collator.compare(left.track.album, right.track.album);

          return albumComparison !== 0
            ? albumComparison
            : collator.compare(left.track.title, right.track.title);
        }
        case "format": {
          const formatComparison = collator.compare(left.track.format, right.track.format);

          return formatComparison !== 0
            ? formatComparison
            : collator.compare(left.track.title, right.track.title);
        }
        case "duration": {
          const durationComparison =
            parseTrackDuration(left.track.duration) - parseTrackDuration(right.track.duration);

          return durationComparison !== 0
            ? durationComparison
            : collator.compare(left.track.title, right.track.title);
        }
        case "title":
        default:
          return collator.compare(left.track.title, right.track.title);
      }
    });

    return sortedRows;
  })();

  displayTrackIndicesRef.current = displayTrackRows.map(({ index }) => index);

  const emptyTrack = getEmptyTrack(appLanguage);
  const selectedTrack = playbackTracks[currentTrackIndex] ?? emptyTrack;
  const selectedTrackKey = getTrackKey(selectedTrack);
  const selectedTrackInViewIndex = sourceTracks.findIndex(
    (track) => getTrackKey(track) === selectedTrackKey,
  );

  const queueRows = playbackQueue
    .map((trackIndex, position) => ({
      position,
      track: playbackTracks[trackIndex],
      trackIndex,
    }))
    .filter(
      (
        row,
      ): row is {
        position: number;
        track: LibraryTrack;
        trackIndex: number;
      } => Boolean(row.track),
    );

  return {
    displayTrackRows,
    emptyTrack,
    filteredTrackRows,
    normalizedSearch,
    queueRows,
    selectedTrack,
    selectedTrackInViewIndex,
    selectedTrackKey,
  };
}
