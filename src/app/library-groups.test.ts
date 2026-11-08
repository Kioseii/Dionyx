import { describe, expect, it } from "vitest";
import {
  buildAlbumGroups,
  buildArtistGroups,
  filterGroups,
  formatTotalDuration,
  getPrimaryArtist,
  normalizeGroupKey,
} from "./library-groups";
import type { LibraryTrack } from "./types";

function track(path: string, artist: string, album: string, duration = "3:00", cover = false): LibraryTrack {
  return {
    title: path,
    artist,
    album,
    format: "FLAC",
    quality: "Lossless local",
    duration,
    path,
    artworkPath: cover ? `/cache/${album}.jpg` : undefined,
  };
}

describe("getPrimaryArtist", () => {
  it("keeps the first artist of a credit list", () => {
    expect(getPrimaryArtist("T-Pistonz+KMC, 山崎徹, KMC")).toBe("T-Pistonz+KMC");
    expect(getPrimaryArtist("Evanescence feat. Someone")).toBe("Evanescence");
    expect(getPrimaryArtist("A ft. B")).toBe("A");
    expect(getPrimaryArtist("海馬成長痛 × Mass Destruction")).toBe("海馬成長痛");
    expect(getPrimaryArtist("Mrs. GREEN APPLE")).toBe("Mrs. GREEN APPLE");
  });
});

describe("normalizeGroupKey", () => {
  it("keeps non-Latin scripts and folds case and width", () => {
    expect(normalizeGroupKey("  勝って泣こうぜッ!  ")).toBe("勝って泣こうぜッ!");
    expect(normalizeGroupKey("ＡＢＣ  Def")).toBe("abc def");
  });
});

describe("buildAlbumGroups", () => {
  const tracks = [
    track("/m/Nocturnas/02 B.flac", "The Quiet Hours", "Nocturnas", "4:00"),
    track("/m/Bajamar/01 A.flac", "Sora Vale", "Bajamar", "3:00", true),
    track("/m/Nocturnas/01 A.flac", "The Quiet Hours", "Nocturnas", "5:00", true),
    track("/m/Mix/01.flac", "Artist One", "Mix"),
    track("/m/Mix/02.flac", "Artist Two, Guest", "Mix"),
    track("/m/Nocturnas/10 C.flac", "the quiet hours", "NOCTURNAS"),
  ];

  const groups = buildAlbumGroups(tracks, "Varios artistas");

  it("groups case-insensitively and sorts albums by name", () => {
    expect(groups.map((g) => g.name)).toEqual(["Bajamar", "Mix", "Nocturnas"]);
  });

  it("orders tracks by file name, numerically", () => {
    const nocturnas = groups.find((g) => g.key === "nocturnas")!;
    expect(nocturnas.indices).toEqual([2, 0, 5]);
    expect(nocturnas.totalSeconds).toBe(12 * 60);
    expect(nocturnas.coverTrack?.path).toBe("/m/Nocturnas/01 A.flac");
  });

  it("labels albums with several primary artists as various", () => {
    expect(groups.find((g) => g.key === "mix")?.artistName).toBe("Varios artistas");
    expect(groups.find((g) => g.key === "bajamar")?.artistName).toBe("Sora Vale");
  });
});

describe("buildArtistGroups", () => {
  it("groups by primary artist and counts albums", () => {
    const groups = buildArtistGroups([
      track("/m/a/2.flac", "Lumen Drift", "Faros"),
      track("/m/b/1.flac", "Lumen Drift, Guest", "Ciudad"),
      track("/m/a/1.flac", "lumen drift", "Faros"),
      track("/m/c/1.flac", "Ivy Kairo", "Señales"),
    ]);

    expect(groups.map((g) => g.name)).toEqual(["Ivy Kairo", "Lumen Drift"]);
    const lumen = groups[1];
    expect(lumen.indices).toEqual([1, 2, 0]);
    expect(lumen.albumCount).toBe(2);
  });
});

describe("filterGroups and formatTotalDuration", () => {
  it("filters by name or album artist", () => {
    const groups = buildAlbumGroups(
      [track("/a.flac", "Sora Vale", "Bajamar"), track("/b.flac", "Ivy Kairo", "Señales")],
      "Varios",
    );
    expect(filterGroups(groups, "sora").map((g) => g.name)).toEqual(["Bajamar"]);
    expect(filterGroups(groups, "").length).toBe(2);
  });

  it("formats minutes and hours", () => {
    expect(formatTotalDuration(42 * 60, "es")).toBe("42 min");
    expect(formatTotalDuration(125 * 60, "es")).toBe("2 h 5 min");
    expect(formatTotalDuration(125 * 60, "en")).toBe("2 hr 5 min");
  });
});
