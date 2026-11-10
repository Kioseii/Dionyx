import { describe, expect, it } from "vitest";
import { indexByIdentity, mostPlayed, recentlyPlayed, songIdentity, type HistoryEntry } from "./history";
import type { LibraryTrack } from "./types";

const track = (artist: string, title: string): LibraryTrack => ({
  album: "",
  artist,
  duration: "3:00",
  format: "FLAC",
  path: `${artist}/${title}.flac`,
  quality: "",
  title,
});

const play = (artist: string, title: string, startedAt: number): HistoryEntry => ({
  album: "",
  artist,
  duration: 180,
  key: `old/${title}`,
  listened: 120,
  startedAt,
  title,
});

const library = [track("Vaundy", "踊り子"), track("Kenshi Yonezu", "Lemon"), track("YOASOBI", "Idol")];
const byId = indexByIdentity(library);

describe("songIdentity", () => {
  it("ignores case, spacing and punctuation but keeps Japanese", () => {
    expect(songIdentity("Mrs. GREEN APPLE", "Soranji")).toBe(songIdentity("mrs green apple", "SORANJI"));
    expect(songIdentity("Vaundy", "踊り子")).not.toBe(songIdentity("Vaundy", "odoriko"));
  });
});

describe("recentlyPlayed", () => {
  it("lists distinct songs newest first and skips songs no longer in the library", () => {
    const entries = [
      play("Vaundy", "踊り子", 1),
      play("Gone", "Deleted", 2),
      play("Kenshi Yonezu", "Lemon", 3),
      play("vaundy", "踊り子", 4),
    ];
    expect(recentlyPlayed(entries, byId, 10)).toEqual([0, 1]);
  });
});

describe("mostPlayed", () => {
  it("counts plays in the period, ties broken by the latest play", () => {
    const entries = [
      play("Kenshi Yonezu", "Lemon", 100),
      play("Kenshi Yonezu", "Lemon", 200),
      play("YOASOBI", "Idol", 300),
      play("Vaundy", "踊り子", 50),
      play("Vaundy", "踊り子", 400),
    ];
    expect(mostPlayed(entries, byId, 0, 3)).toEqual([
      { count: 2, index: 0 },
      { count: 2, index: 1 },
      { count: 1, index: 2 },
    ]);
    expect(mostPlayed(entries, byId, 150, 3)[0]).toEqual({ count: 1, index: 0 });
  });
});
