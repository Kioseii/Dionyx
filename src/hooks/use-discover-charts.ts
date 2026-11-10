import { useEffect, useRef, useState } from "react";
import { storageKeys } from "../app/constants";
import {
  aggregateTasteTags,
  getLastfmArtistSeeds,
  getLibraryArtistSeeds,
  interleaveUnique,
  type ArtistTag,
  type TasteSeed,
} from "../app/discover-taste";
import { getLastfmTrackArtist, lastfmPublicGet } from "../app/lastfm-public";
import type { LastFmTrack, LibraryTrack } from "../app/types";
import { readStoredValue, writeStoredValue } from "../app/utils";

export type ChartSource = { kind: "mix" } | { kind: "tag"; tag: string } | { kind: "global" };
export type TasteBasis = "lastfm" | "library";

export const CHART_PAGE_SIZE = 30;
/** Last.fm goes deep, but past ~600 songs a "top" stops meaning much. */
const MAX_PAGES = 20;
const MIX_TAG_COUNT = 3;
const SEEDS_FOR_TAGS = 8;
const TASTE_TTL_MS = 24 * 60 * 60 * 1000;
const COVER_BATCH = 6;

type TracksPage = {
  tracks?: { track?: LastFmTrack[]; "@attr"?: { totalPages?: string } };
};

type CachedTaste = { basis: TasteBasis; key: string; savedAt: number; tags: string[] };

const sourceKey = (source: ChartSource) => (source.kind === "tag" ? `tag:${source.tag}` : source.kind);

async function fetchTagPage(tag: string, page: number, limit: number) {
  const data = await lastfmPublicGet<TracksPage>({
    limit: String(limit),
    method: "tag.getTopTracks",
    page: String(page + 1),
    tag,
  });
  return {
    totalPages: Number(data.tracks?.["@attr"]?.totalPages ?? 1),
    tracks: data.tracks?.track ?? [],
  };
}

async function loadTaste(lastfmUserName: string | null, tracks: LibraryTrack[]) {
  let seeds: TasteSeed[] = [];
  let basis: TasteBasis = "library";

  if (lastfmUserName) {
    try {
      const data = await lastfmPublicGet<{ topartists?: { artist?: Array<{ name: string; playcount?: string }> } }>({
        limit: "12",
        method: "user.getTopArtists",
        period: "6month",
        user: lastfmUserName,
      });
      seeds = getLastfmArtistSeeds(data.topartists?.artist ?? []);
      basis = "lastfm";
    } catch {
      seeds = [];
    }
  }

  // A new Last.fm account has little history yet: use the library instead.
  if (seeds.length < 3) {
    seeds = getLibraryArtistSeeds(tracks);
    basis = "library";
  }

  const withTags = await Promise.all(
    seeds.slice(0, SEEDS_FOR_TAGS).map(async (seed) => {
      try {
        const data = await lastfmPublicGet<{ toptags?: { tag?: ArtistTag[] } }>({
          artist: seed.name,
          autocorrect: "1",
          method: "artist.getTopTags",
        });
        return { seed, tags: data.toptags?.tag ?? [] };
      } catch {
        return { seed, tags: [] };
      }
    }),
  );

  return { basis, tags: aggregateTasteTags(withTags) };
}

/**
 * Discover › Charts: the most played songs of the listener's own genres
 * (taken from their Last.fm history, or from the library when not
 * connected), or the global chart, 30 per page.
 */
export function useDiscoverCharts({
  active,
  getItunesCover,
  lastfmUserName,
  tracks,
}: {
  active: boolean;
  getItunesCover: (term: string, entity: "musicArtist" | "song", artist?: string) => Promise<string>;
  lastfmUserName: string | null;
  tracks: LibraryTrack[];
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [basis, setBasis] = useState<TasteBasis | null>(null);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [source, setSourceState] = useState<ChartSource>({ kind: "mix" });
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [items, setItems] = useState<LastFmTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const pageCacheRef = useRef(new Map<string, { items: LastFmTrack[]; pageCount: number }>());
  const coverCacheRef = useRef(new Map<string, string>());
  const requestRef = useRef(0);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // What the genres are based on; the library only by size, so they are not
  // recomputed on every small change.
  const tasteKey = lastfmUserName ? `lastfm:${lastfmUserName}` : `library:${Math.round(tracks.length / 25)}`;
  const tasteReady = basis !== null;

  useEffect(() => {
    if (!active) return;

    try {
      const cached = JSON.parse(readStoredValue(storageKeys.discoverTaste) ?? "null") as CachedTaste | null;
      if (cached && cached.key === tasteKey && Date.now() - cached.savedAt < TASTE_TTL_MS) {
        setTags(cached.tags);
        setBasis(cached.basis);
        return;
      }
    } catch {
      // Recompute below.
    }

    let cancelled = false;
    setTasteLoading(true);
    void loadTaste(lastfmUserName, tracksRef.current)
      .then((result) => {
        if (cancelled) return;
        setTags(result.tags);
        setBasis(result.basis);
        pageCacheRef.current.clear();
        writeStoredValue(
          storageKeys.discoverTaste,
          JSON.stringify({ ...result, key: tasteKey, savedAt: Date.now() } satisfies CachedTaste),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTags([]);
          setBasis("library");
        }
      })
      .finally(() => {
        if (!cancelled) setTasteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, lastfmUserName, tasteKey]);

  // Without genres only the global chart makes sense; a removed genre falls back to the mix.
  const effectiveSource: ChartSource =
    tags.length === 0
      ? { kind: "global" }
      : source.kind === "tag" && !tags.includes(source.tag)
        ? { kind: "mix" }
        : source;
  const effectiveKey = sourceKey(effectiveSource);

  useEffect(() => {
    if (!active || !tasteReady) return;

    const cacheKey = `${effectiveKey}:${page}`;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const cached = pageCacheRef.current.get(cacheKey);

    if (cached) {
      setItems(cached.items);
      setPageCount(cached.pageCount);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    void (async () => {
      try {
        let pageItems: LastFmTrack[];
        let totalPages: number;

        if (effectiveSource.kind === "global") {
          const data = await lastfmPublicGet<TracksPage>({
            limit: String(CHART_PAGE_SIZE),
            method: "chart.getTopTracks",
            page: String(page + 1),
          });
          pageItems = data.tracks?.track ?? [];
          totalPages = Number(data.tracks?.["@attr"]?.totalPages ?? 1);
        } else if (effectiveSource.kind === "tag") {
          const result = await fetchTagPage(effectiveSource.tag, page, CHART_PAGE_SIZE);
          pageItems = result.tracks;
          totalPages = result.totalPages;
        } else {
          // "For you": the top songs of your three main genres, taking turns.
          // A few extra per genre make up for songs shared between genres.
          const perTag = Math.ceil((CHART_PAGE_SIZE * 1.25) / Math.min(MIX_TAG_COUNT, tags.length));
          const results = await Promise.all(
            tags.slice(0, MIX_TAG_COUNT).map((tag) => fetchTagPage(tag, page, perTag).catch(() => null)),
          );
          const ok = results.filter((result): result is NonNullable<typeof result> => result !== null);
          if (ok.length === 0) throw new Error("no genre answered");
          pageItems = interleaveUnique(ok.map((result) => result.tracks), CHART_PAGE_SIZE);
          totalPages = Math.min(...ok.map((result) => result.totalPages));
        }

        const nextPageCount = Math.min(Math.max(totalPages || 1, 1), MAX_PAGES);
        const withCovers = pageItems.map((track) => {
          const cover = coverCacheRef.current.get(`${getLastfmTrackArtist(track)} ${track.name}`);
          return cover ? { ...track, coverUrl: cover } : { ...track };
        });

        if (requestId !== requestRef.current) return;
        setItems(withCovers);
        setPageCount(nextPageCount);
        setLoading(false);
        pageCacheRef.current.set(cacheKey, { items: withCovers, pageCount: nextPageCount });

        // Covers (Last.fm no longer serves track art): fill them in as they arrive.
        for (let index = 0; index < withCovers.length; index += COVER_BATCH) {
          const batch = withCovers.slice(index, index + COVER_BATCH);
          await Promise.all(
            batch.map(async (track) => {
              if (track.coverUrl) return;
              const term = `${getLastfmTrackArtist(track)} ${track.name}`;
              const cover = await getItunesCover(term, "song", getLastfmTrackArtist(track));
              coverCacheRef.current.set(term, cover);
              track.coverUrl = cover;
            }),
          );
          if (requestId !== requestRef.current) return;
          setItems([...withCovers]);
        }
      } catch {
        if (requestId !== requestRef.current) return;
        setItems([]);
        setError(true);
        setLoading(false);
      }
    })();
  // effectiveSource is described by effectiveKey.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, effectiveKey, page, tasteReady, tags]);

  return {
    basis,
    error,
    items,
    loading: loading || tasteLoading,
    page,
    pageCount,
    pageSize: CHART_PAGE_SIZE,
    setPage: (next: number) => setPage(Math.min(Math.max(next, 0), pageCount - 1)),
    setSource: (next: ChartSource) => {
      setSourceState(next);
      setPage(0);
    },
    source: effectiveSource,
    tags,
  };
}
