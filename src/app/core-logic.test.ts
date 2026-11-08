import { describe, expect, it } from "vitest";
import { parsePlainLyrics, parseSyncedLyrics } from "../hooks/use-track-lyrics";
import { resolveSelectedTrackIndex } from "./track-selection";
import type { LibraryTrack, SavedPlaylist } from "./types";
import {
  findMatchingTrackIndex,
  getOnAccentColor,
  getTrackKey,
  hexToRgb,
  reconcilePlaylistsWithLibrary,
  serializePlaylistsForStorage,
} from "./utils";

function track(path: string, overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");
  return {
    title: name,
    artist: "Artist",
    album: "Album",
    format: "MP3",
    quality: "Compressed local",
    duration: "3:00",
    path,
    ...overrides,
  };
}

describe("resolveSelectedTrackIndex", () => {
  const a = track("/m/a.mp3");
  const b = track("/m/b.mp3");
  const c = track("/m/c.mp3");

  it("trusts an index that was set on purpose", () => {
    expect(resolveSelectedTrackIndex([a, b, c], 0, getTrackKey(b), true)).toBe(0);
  });

  it("follows the playing track when the list is reordered under it", () => {
    // b was playing at index 1; the playlist became [b, a, c].
    expect(resolveSelectedTrackIndex([b, a, c], 1, getTrackKey(b), false)).toBe(0);
  });

  it("follows the playing track when an earlier track is deleted", () => {
    expect(resolveSelectedTrackIndex([b, c], 1, getTrackKey(c), false)).toBe(1);
    expect(resolveSelectedTrackIndex([a, c], 2, getTrackKey(c), false)).toBe(1);
  });

  it("keeps the index when the previous track is gone", () => {
    expect(resolveSelectedTrackIndex([a, c], 1, getTrackKey(b), false)).toBe(1);
  });
});

describe("getOnAccentColor", () => {
  it("keeps light text on the default and other dark accents", () => {
    expect(getOnAccentColor(hexToRgb("#A85EFF"))).toBe("#fefbff");
    expect(getOnAccentColor(hexToRgb("#2B3A66"))).toBe("#fefbff");
  });

  it("switches to dark text on light accents", () => {
    expect(getOnAccentColor(hexToRgb("#E6E2EA"))).toBe("#14101c");
    expect(getOnAccentColor(hexToRgb("#FFFFFF"))).toBe("#14101c");
    expect(getOnAccentColor(hexToRgb("#FFE45E"))).toBe("#14101c");
  });
});

describe("serializePlaylistsForStorage", () => {
  it("drops inline artwork and blob sources but keeps the rest", () => {
    const playlist: SavedPlaylist = {
      id: "p1",
      name: "Night",
      sourceCollectionName: "Music",
      sourcePath: "/m",
      createdAt: 1,
      tracks: [
        track("/m/a.mp3", {
          artworkDataUrl: "data:image/png;base64,AAAA",
          artworkPath: "/cache/artwork/ab.jpg",
          source: "blob:x",
        }),
      ],
    };
    const [stored] = JSON.parse(serializePlaylistsForStorage([playlist]));
    expect(stored.tracks[0]).not.toHaveProperty("artworkDataUrl");
    expect(stored.tracks[0]).not.toHaveProperty("source");
    expect(stored.tracks[0].path).toBe("/m/a.mp3");
    // The cached cover path is tiny, so playlists keep their covers on restart.
    expect(stored.tracks[0].artworkPath).toBe("/cache/artwork/ab.jpg");
    expect(stored.name).toBe("Night");
  });
});

describe("playlist reconciliation", () => {
  it("re-links a moved file by its metadata and restores artwork", () => {
    const saved = track("/old/Song.mp3", { title: "Song", artist: "X", duration: "4:10" });
    const moved = track("/new/sub/Song.mp3", {
      title: "Song",
      artist: "X",
      duration: "4:10",
      artworkDataUrl: "data:image/png;base64,AAAA",
    });
    const [playlist] = reconcilePlaylistsWithLibrary(
      [{ id: "p", name: "p", sourceCollectionName: "", sourcePath: null, createdAt: 0, tracks: [saved] }],
      [track("/new/other.mp3"), moved],
    );
    expect(playlist.tracks[0].path).toBe("/new/sub/Song.mp3");
    expect(playlist.tracks[0].artworkDataUrl).toBe("data:image/png;base64,AAAA");
  });

  it("prefers an exact path match", () => {
    const target = track("/m/a.mp3");
    expect(findMatchingTrackIndex(target, [track("/x/a.mp3"), track("/m/a.mp3")])).toBe(1);
  });

  it("keeps the saved track when nothing matches", () => {
    const saved = track("/gone/zzz.mp3", { title: "Zzz", artist: "Nobody" });
    const [playlist] = reconcilePlaylistsWithLibrary(
      [{ id: "p", name: "p", sourceCollectionName: "", sourcePath: null, createdAt: 0, tracks: [saved] }],
      [track("/m/a.mp3")],
    );
    expect(playlist.tracks[0]).toEqual(saved);
  });
});

describe("lyrics parsing", () => {
  it("parses LRC timestamps, sorts them and expands repeated tags", () => {
    const lines = parseSyncedLyrics("[00:12.50]Second\n[00:01.2]First\n[00:20.00][00:30.00]Chorus\n[00:05.00]\n");
    expect(lines.map((line) => [line.startTimeMs, line.text])).toEqual([
      [1200, "First"],
      [12500, "Second"],
      [20000, "Chorus"],
      [30000, "Chorus"],
    ]);
  });

  it("strips markup characters and empty lines from plain lyrics", () => {
    expect(parsePlainLyrics("Hello <b>world</b>\n\n  Line two ").map((line) => line.text)).toEqual([
      "Hello bworld/b",
      "Line two",
    ]);
  });
});
