import { describe, expect, it } from "vitest";
import {
  aggregateTasteTags,
  getLastfmArtistSeeds,
  getLibraryArtistSeeds,
  interleaveUnique,
} from "./discover-taste";
import type { LibraryTrack } from "./types";

const song = (artist: string): LibraryTrack => ({
  album: "",
  artist,
  duration: "",
  format: "MP3",
  path: `${artist}-${Math.random()}`,
  quality: "",
  title: "x",
});

describe("taste seeds", () => {
  it("ranks library artists by song count and skips unknown ones", () => {
    const seeds = getLibraryArtistSeeds([
      song("Mrs. GREEN APPLE"),
      song("Mrs. GREEN APPLE"),
      song("Kenshi Yonezu feat. Hikaru Utada"),
      song("Unknown Artist"),
    ]);
    expect(seeds.map((seed) => seed.name)).toEqual(["Mrs. GREEN APPLE", "Kenshi Yonezu"]);
    expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
  });

  it("weights Last.fm top artists by playcount", () => {
    const seeds = getLastfmArtistSeeds([
      { name: "A", playcount: "500" },
      { name: "B", playcount: "3" },
    ]);
    expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
  });
});

describe("aggregateTasteTags", () => {
  it("adds up genres across artists and drops junk, years and artist names", () => {
    const tags = aggregateTasteTags([
      {
        seed: { name: "Band A", weight: 3 },
        tags: [
          { count: 100, name: "J-rock" },
          { count: 80, name: "seen live" },
          { count: 60, name: "2010s" },
          { count: 50, name: "Band B" },
        ],
      },
      {
        seed: { name: "Band B", weight: 2 },
        tags: [
          { count: 100, name: "j-pop" },
          { count: 70, name: "J-Rock" },
        ],
      },
    ]);
    expect(tags).toEqual(["j-rock", "j-pop"]);
  });
});

describe("interleaveUnique", () => {
  it("alternates between lists and skips repeats", () => {
    const t = (artist: string, name: string) => ({ artist: { name: artist }, name });
    const merged = interleaveUnique(
      [
        [t("A", "1"), t("A", "2")],
        [t("A", "1"), t("B", "1")],
        [t("C", "1")],
      ],
      10,
    );
    expect(merged.map((track) => `${(track.artist as { name: string }).name}${track.name}`)).toEqual([
      "A1",
      "C1",
      "A2",
      "B1",
    ]);
  });
});
