import { describe, expect, it } from "vitest";
import { buildM3u, matchM3uToLibrary, normalizePath, parseM3u, playlistNameFromFile } from "./m3u";
import type { LibraryTrack } from "./types";

const track = (path: string, title = "Song", artist = "Band", duration = "3:05"): LibraryTrack => ({
  album: "",
  artist,
  duration,
  format: "FLAC",
  path,
  quality: "",
  title,
});

describe("normalizePath", () => {
  it("unifies slashes and resolves . and ..", () => {
    expect(normalizePath("C:\\Music\\Album\\..\\Other\\.\\a.flac")).toBe("C:/Music/Other/a.flac");
    expect(normalizePath("/home/me/music/../x.mp3")).toBe("/home/me/x.mp3");
  });
});

describe("buildM3u", () => {
  it("writes relative paths inside the playlist's folder and absolute ones outside", () => {
    const text = buildM3u(
      [track("C:\\Music\\Album\\one.flac", "One"), track("D:\\Other\\two.mp3", "Two", "Band", "--:--")],
      "C:\\music\\Road trip.m3u8",
    );
    expect(text.split("\r\n")).toEqual([
      "#EXTM3U",
      "#EXTINF:185,Band - One",
      "Album/one.flac",
      "#EXTINF:-1,Band - Two",
      "D:\\Other\\two.mp3",
      "",
    ]);
  });
});

describe("parseM3u", () => {
  it("resolves relative, absolute and file:// entries and skips comments", () => {
    const text = "\uFEFF#EXTM3U\r\n#EXTINF:1,x\r\nAlbum\\one.flac\r\n../Other/two.mp3\r\nE:\\abs.mp3\r\nfile:///C:/My%20Music/three.ogg\r\n";
    expect(parseM3u(text, "C:\\Music\\list.m3u")).toEqual([
      "C:/Music/Album/one.flac",
      "C:/Other/two.mp3",
      "E:/abs.mp3",
      "C:/My Music/three.ogg",
    ]);
  });
});

describe("matchM3uToLibrary", () => {
  it("matches by path ignoring case, then by file name, and reports the rest", () => {
    const library = [track("C:\\Music\\Album\\One.flac", "One"), track("C:\\Music\\two.mp3", "Two")];
    const result = matchM3uToLibrary(["c:/music/album/one.flac", "F:/phone/two.mp3", "C:/gone.mp3"], library);
    expect(result.matched.map((item) => item.title)).toEqual(["One", "Two"]);
    expect(result.missing).toEqual(["C:/gone.mp3"]);
  });
});

describe("playlistNameFromFile", () => {
  it("uses the file name without extension", () => {
    expect(playlistNameFromFile("C:\\Lists\\Road trip.m3u8")).toBe("Road trip");
  });
});
