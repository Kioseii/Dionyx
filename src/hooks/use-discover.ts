import { useEffect, useMemo, useRef, useState } from "react";
import { DISCOVER_SEED_ARTISTS_PER_PAGE } from "../app/constants";
import type {
  DiscoverPreviewState,
  DiscoverTab,
  LastFmArtist,
  LastFmTrack,
  LibraryTrack,
} from "../app/types";
import { normalizeDiscoverLookup } from "../app/utils";
import { lastfmPublicGet } from "../app/lastfm-public";
import { findCover, isLastfmPlaceholder } from "../app/covers";


type UseDiscoverOptions = {
  discoverErrorMessage: string;
  tracks: LibraryTrack[];
};

export function useDiscover({
  discoverErrorMessage,
  tracks,
}: UseDiscoverOptions) {
  const discoverPreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const discoverPreviewCacheRef = useRef(new Map<string, string | null>());
  const discoverPreviewRequestIdRef = useRef(0);

  const [isDiscoverView, setIsDiscoverView] = useState(false);
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>("foryou");
  const [discoverForYou, setDiscoverForYou] = useState<LastFmArtist[]>([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverForYouPage, setDiscoverForYouPage] = useState(0);
  const [activeDiscoverPreviewKey, setActiveDiscoverPreviewKey] = useState<string | null>(null);
  const [activeDiscoverPreviewUrl, setActiveDiscoverPreviewUrl] = useState<string | null>(null);
  const [discoverPreviewState, setDiscoverPreviewState] = useState<DiscoverPreviewState>("idle");

  const discoverLibraryArtistSeeds = useMemo(() => {
    const artistTrackCount = new Map<string, { count: number; name: string }>();

    for (const track of tracks) {
      const artistName = track.artist.split(/[,;/]/)[0].trim();

      if (!artistName) {
        continue;
      }

      const key = artistName.toLowerCase();
      const currentValue = artistTrackCount.get(key);

      if (currentValue) {
        currentValue.count += 1;
      } else {
        artistTrackCount.set(key, { count: 1, name: artistName });
      }
    }

    return [...artistTrackCount.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .map(([key, value]) => ({
        key,
        count: value.count,
        name: value.name,
      }));
  }, [tracks]);

  const discoverForYouPageCount = Math.max(
    1,
    Math.ceil(discoverLibraryArtistSeeds.length / DISCOVER_SEED_ARTISTS_PER_PAGE),
  );
  const safeDiscoverForYouPage = Math.min(discoverForYouPage, discoverForYouPageCount - 1);

  const lastFmGet = (params: Record<string, string>): Promise<unknown> => lastfmPublicGet(params);

  function getLastFmImage(
    images: { "#text": string; size: string }[] | undefined,
    prefer = "large",
  ) {
    if (!images) return "";
    const url = (images.find((item) => item.size === prefer) ?? images[images.length - 1])?.["#text"] ?? "";
    return isLastfmPlaceholder(url) ? "" : url;
  }

  function getDiscoverPreviewKey(artistName: string, trackName: string) {
    return `${artistName}::${trackName}`;
  }

  // Cover lookups (Deezer, then iTunes) with a shared on-disk cache.
  const getItunesCover = (term: string, entity: "musicArtist" | "song", artist?: string) =>
    findCover(term, entity, artist);

  async function getItunesPreviewUrl(artistName: string, trackName: string): Promise<string> {
    try {
      const term = `${artistName} ${trackName}`;
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=6&media=music`;
      const response = await fetch(url);

      if (!response.ok) {
        return "";
      }

      const data = await response.json() as {
        results?: Array<{
          previewUrl?: string;
          artistName?: string;
          trackName?: string;
        }>;
      };
      const normalizedArtist = normalizeDiscoverLookup(artistName);
      const normalizedTrack = normalizeDiscoverLookup(trackName);
      const bestMatch = (data.results ?? [])
        .filter((item) => typeof item.previewUrl === "string" && item.previewUrl.length > 0)
        .map((item) => {
          const resultArtist = normalizeDiscoverLookup(item.artistName ?? "");
          const resultTrack = normalizeDiscoverLookup(item.trackName ?? "");
          let score = 0;

          if (resultArtist === normalizedArtist) {
            score += 4;
          } else if (resultArtist.includes(normalizedArtist) || normalizedArtist.includes(resultArtist)) {
            score += 2;
          }

          if (resultTrack === normalizedTrack) {
            score += 5;
          } else if (resultTrack.includes(normalizedTrack) || normalizedTrack.includes(resultTrack)) {
            score += 3;
          }

          return { previewUrl: item.previewUrl ?? "", score };
        })
        .sort((left, right) => right.score - left.score)[0];

      return bestMatch?.score ? bestMatch.previewUrl : "";
    } catch {
      return "";
    }
  }

  async function handleDiscoverPreviewToggle(artistName: string, trackName: string) {
    const previewKey = getDiscoverPreviewKey(artistName, trackName);
    const previewAudio = discoverPreviewAudioRef.current;

    if (!previewAudio) {
      return;
    }

    if (activeDiscoverPreviewKey === previewKey) {
      if (discoverPreviewState === "playing") {
        previewAudio.pause();
        return;
      }

      if (activeDiscoverPreviewUrl) {
        try {
          await previewAudio.play();
          setDiscoverPreviewState("playing");
        } catch {
          setDiscoverPreviewState("error");
        }
        return;
      }
    }

    const requestId = discoverPreviewRequestIdRef.current + 1;
    discoverPreviewRequestIdRef.current = requestId;
    setActiveDiscoverPreviewKey(previewKey);
    setActiveDiscoverPreviewUrl(null);
    setDiscoverPreviewState("loading");

    const cachedUrl = discoverPreviewCacheRef.current.get(previewKey);
    const previewUrl =
      typeof cachedUrl !== "undefined" ? cachedUrl : await getItunesPreviewUrl(artistName, trackName);

    if (requestId !== discoverPreviewRequestIdRef.current) {
      return;
    }

    if (typeof cachedUrl === "undefined") {
      discoverPreviewCacheRef.current.set(previewKey, previewUrl || null);
    }

    if (!previewUrl) {
      setActiveDiscoverPreviewUrl(null);
      setDiscoverPreviewState("unavailable");
      return;
    }

    setActiveDiscoverPreviewUrl(previewUrl);
    previewAudio.src = previewUrl;
    previewAudio.load();

    try {
      await previewAudio.play();
      setDiscoverPreviewState("playing");
    } catch {
      setDiscoverPreviewState("error");
    }
  }

  async function loadDiscoverForYou(page = safeDiscoverForYouPage) {
    const boundedPage = Math.min(Math.max(page, 0), Math.max(discoverForYouPageCount - 1, 0));
    const pageSeeds = discoverLibraryArtistSeeds.slice(
      boundedPage * DISCOVER_SEED_ARTISTS_PER_PAGE,
      (boundedPage + 1) * DISCOVER_SEED_ARTISTS_PER_PAGE,
    );

    if (pageSeeds.length === 0) {
      setDiscoverForYou([]);
      return;
    }

    const libraryArtistSet = new Set(discoverLibraryArtistSeeds.map((artist) => artist.key));
    const scoreMap = new Map<string, number>();
    const artistDataMap = new Map<string, LastFmArtist>();

    await Promise.all(
      pageSeeds.map(async (seed) => {
        const weight = Math.log2(seed.count + 1);
        try {
          const data = await lastFmGet({
            method: "artist.getSimilar",
            artist: seed.name,
            limit: "12",
          }) as { similarartists?: { artist?: LastFmArtist[] } };
          const similar = data?.similarartists?.artist ?? [];
          similar.forEach((artist, rank) => {
            const artistKey = artist.name.toLowerCase();
            if (libraryArtistSet.has(artistKey)) return;
            const rankBonus = 1 - rank / similar.length;
            const score = weight * (0.6 + 0.4 * rankBonus);
            scoreMap.set(artistKey, (scoreMap.get(artistKey) ?? 0) + score);
            if (!artistDataMap.has(artistKey)) artistDataMap.set(artistKey, artist);
          });
        } catch {
          // Ignore a single seed failing.
        }
      }),
    );

    const topArtists = [...scoreMap.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([key]) => artistDataMap.get(key)!)
      .filter(Boolean);

    await Promise.all(
      topArtists.map(async (artist) => {
        const tracksData = await lastFmGet({
          method: "artist.getTopTracks",
          artist: artist.name,
          limit: "3",
        }).catch(() => null) as { toptracks?: { track?: LastFmTrack[] } } | null;
        artist.topTracks = tracksData?.toptracks?.track ?? [];
        // Artist cards: the cover of their top song (album art is reliable;
        // artist photos sometimes belong to a duplicate profile), else a photo.
        const firstTrack = artist.topTracks[0];
        artist.coverUrl =
          (firstTrack ? await findCover(`${artist.name} ${firstTrack.name}`, "song", artist.name) : "") ||
          (await findCover(artist.name, "musicArtist"));
      }),
    );

    setDiscoverForYou(topArtists);
  }

  async function loadDiscoverContent() {
    setIsDiscoverLoading(true);
    setDiscoverError(null);
    try {
      // Charts load on their own (use-discover-charts).
      if (discoverTab === "foryou") {
        await loadDiscoverForYou();
      }
    } catch {
      setDiscoverError(discoverErrorMessage);
    } finally {
      setIsDiscoverLoading(false);
    }
  }

  useEffect(() => {
    if (!isDiscoverView) return;
    void loadDiscoverContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverForYouPage, discoverTab, isDiscoverView, discoverErrorMessage]);

  useEffect(() => {
    if (discoverForYouPage > discoverForYouPageCount - 1) {
      setDiscoverForYouPage(Math.max(discoverForYouPageCount - 1, 0));
    }
  }, [discoverForYouPage, discoverForYouPageCount]);

  useEffect(() => {
    if (isDiscoverView) {
      return;
    }

    discoverPreviewAudioRef.current?.pause();
  }, [isDiscoverView]);

  useEffect(() => {
    return () => {
      discoverPreviewAudioRef.current?.pause();
    };
  }, []);

  return {
    activeDiscoverPreviewKey,
    discoverError,
    discoverForYou,
    discoverForYouPage,
    discoverForYouPageCount,
    discoverPreviewAudioRef,
    discoverPreviewState,
    discoverTab,
    getDiscoverPreviewKey,
    getItunesCover,
    getLastFmImage,
    handleDiscoverPreviewToggle,
    isDiscoverLoading,
    isDiscoverView,
    safeDiscoverForYouPage,
    setDiscoverForYouPage,
    setDiscoverPreviewState,
    setDiscoverTab,
    setIsDiscoverView,
  };
}
