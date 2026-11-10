import { useEffect, useMemo, useState } from "react";
import { storageKeys } from "../app/constants";
import {
  buildAlbumGroups,
  buildArtistGroups,
  type LibraryFilter,
  type TrackGroup,
} from "../app/library-groups";
import type { LibraryTrack } from "../app/types";
import { readStoredValue, writeStoredValue } from "../app/utils";

export type LibraryView = "songs" | "albums" | "artists";

type UseLibraryBrowseOptions = {
  tracks: LibraryTrack[];
  variousArtistsLabel: string;
};

/**
 * Library browsing: Songs / Albums / Artists tabs and the album or artist
 * currently open. Groups are derived from the library tracks.
 */
export function useLibraryBrowse({ tracks, variousArtistsLabel }: UseLibraryBrowseOptions) {
  const [libraryView, setLibraryView] = useState<LibraryView>(() => {
    const stored = readStoredValue(storageKeys.libraryView);
    return stored === "albums" || stored === "artists" ? stored : "songs";
  });
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>(null);

  useEffect(() => {
    writeStoredValue(storageKeys.libraryView, libraryView);
  }, [libraryView]);

  const albumGroups = useMemo(
    () => buildAlbumGroups(tracks, variousArtistsLabel),
    [tracks, variousArtistsLabel],
  );
  const artistGroups = useMemo(() => buildArtistGroups(tracks), [tracks]);

  const activeGroup: TrackGroup | null = libraryFilter
    ? (libraryFilter.kind === "album" ? albumGroups : artistGroups).find(
        (group) => group.key === libraryFilter.key,
      ) ?? null
    : null;

  // The open album/artist disappeared (rescan, deletion): go back to the grid.
  useEffect(() => {
    if (libraryFilter && tracks.length > 0 && !activeGroup) {
      setLibraryFilter(null);
    }
  }, [activeGroup, libraryFilter, tracks.length]);

  return {
    activeGroup,
    albumGroups,
    artistGroups,
    libraryFilter,
    libraryFilterIndices: activeGroup?.indices ?? null,
    libraryView,
    setLibraryFilter,
    setLibraryView,
  };
}
