import { describe, expect, it } from "vitest";
import { findDuplicates } from "./duplicates";
import type { LibraryTrack } from "./types";

const track = (path: string, title: string, format: string, duration = "3:30", artist = "Band"): LibraryTrack => ({
  album: "",
  artist,
  duration,
  format,
  path,
  quality: "",
  title,
});

describe("findDuplicates", () => {
  it("groups the same song in several formats, best quality first", () => {
    const library = [
      track("a/Song.mp3", "Song", "MP3"),
      track("b/Song.flac", "song", "FLAC", "3:31"),
      track("c/Other.mp3", "Other", "MP3"),
      track("d/Song.opus", "SONG", "OPUS"),
    ];
    expect(findDuplicates(library)).toEqual([{ artist: "Band", indices: [1, 3, 0], title: "song" }]);
  });

  it("keeps a live version with a very different length apart", () => {
    const library = [track("a.flac", "Song", "FLAC", "3:30"), track("b.flac", "Song", "FLAC", "5:10")];
    expect(findDuplicates(library)).toEqual([]);
  });

  it("does not mix artists", () => {
    const library = [track("a.mp3", "Intro", "MP3", "1:00", "A"), track("b.mp3", "Intro", "MP3", "1:00", "B")];
    expect(findDuplicates(library)).toEqual([]);
  });
});
