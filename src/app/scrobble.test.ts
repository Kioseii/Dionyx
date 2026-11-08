import { describe, expect, it } from "vitest";
import {
  appendToQueue,
  buildScrobbleItem,
  classifyLastfmError,
  isScrobbleEligible,
  listenedDelta,
  MAX_QUEUED_SCROBBLES,
  scrobbleThreshold,
} from "./scrobble";

describe("scrobble rules", () => {
  it("needs songs longer than 30 s and half of them or 4 minutes", () => {
    expect(isScrobbleEligible(25)).toBe(false);
    expect(isScrobbleEligible(31)).toBe(true);
    expect(scrobbleThreshold(200)).toBe(100);
    expect(scrobbleThreshold(900)).toBe(240);
  });

  it("counts normal progress but not seeks or going back", () => {
    expect(listenedDelta(10, 10.25)).toBeCloseTo(0.25);
    expect(listenedDelta(10, 60)).toBe(0);
    expect(listenedDelta(60, 10)).toBe(0);
  });
});

describe("buildScrobbleItem", () => {
  it("skips songs without a real artist", () => {
    expect(buildScrobbleItem({ album: "A", artist: "Unknown Artist", title: "Song" }, 200, 1000)).toBeNull();
    expect(buildScrobbleItem({ album: "A", artist: " ", title: "Song" }, 200, 1000)).toBeNull();
  });

  it("drops placeholder albums and rounds numbers", () => {
    expect(buildScrobbleItem({ album: "Unknown Album", artist: "Band", title: "Song" }, 200.6, 1000.9)).toEqual({
      album: undefined,
      artist: "Band",
      duration: 201,
      timestamp: 1000,
      track: "Song",
    });
  });
});

describe("classifyLastfmError", () => {
  it("tells apart the cases the app reacts to", () => {
    expect(classifyLastfmError("lastfm:not-configured")).toBe("not-configured");
    expect(classifyLastfmError("lastfm:network:timeout")).toBe("network");
    expect(classifyLastfmError("lastfm:16:Temporary error")).toBe("network");
    expect(classifyLastfmError("lastfm:9:Invalid session key")).toBe("invalid-session");
    expect(classifyLastfmError("lastfm:14:Unauthorized Token")).toBe("unauthorized-token");
    expect(classifyLastfmError("lastfm:6:Invalid parameters")).toBe("other");
  });
});

describe("appendToQueue", () => {
  it("keeps only the newest plays when full", () => {
    const item = (n: number) => ({ artist: "A", timestamp: n, track: "T" });
    const full = Array.from({ length: MAX_QUEUED_SCROBBLES }, (_, n) => item(n));
    const next = appendToQueue(full, [item(9999)]);
    expect(next).toHaveLength(MAX_QUEUED_SCROBBLES);
    expect(next[next.length - 1].timestamp).toBe(9999);
    expect(next[0].timestamp).toBe(1);
  });
});
