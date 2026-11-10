import { describe, expect, it } from "vitest";
import {
  normalizationFactor,
  sanitizeNormalizationMode,
  sanitizePreampDb,
  UNTAGGED_GAIN_DB,
} from "./normalization";

const db = (value: number) => 10 ** (value / 20);

describe("normalizationFactor", () => {
  it("does nothing when off", () => {
    expect(normalizationFactor({ replayGainTrack: -9 }, "off", 0)).toBe(1);
  });

  it("turns loud songs down by their track gain", () => {
    expect(normalizationFactor({ replayGainTrack: -9 }, "track", 0)).toBeCloseTo(db(-9));
  });

  it("uses the album gain in album mode, falling back to the track gain", () => {
    const song = { replayGainAlbum: -6, replayGainTrack: -10 };
    expect(normalizationFactor(song, "album", 0)).toBeCloseTo(db(-6));
    expect(normalizationFactor({ replayGainTrack: -10 }, "album", 0)).toBeCloseTo(db(-10));
  });

  it("adds the pre-amp", () => {
    expect(normalizationFactor({ replayGainTrack: -9 }, "track", 3)).toBeCloseTo(db(-6));
  });

  it("gives untagged songs the default gain", () => {
    expect(normalizationFactor({}, "track", 0)).toBeCloseTo(db(UNTAGGED_GAIN_DB));
  });

  it("never boosts above full volume or past the peak", () => {
    expect(normalizationFactor({ replayGainTrack: 4 }, "track", 0)).toBe(1);
    // -2 dB would be 0.79, but a peak of 1.5 allows at most 1/1.5 = 0.67.
    expect(normalizationFactor({ replayGainPeak: 1.5, replayGainTrack: -2 }, "track", 0)).toBeCloseTo(1 / 1.5);
  });
});

describe("settings", () => {
  it("sanitizes stored values", () => {
    expect(sanitizeNormalizationMode("album")).toBe("album");
    expect(sanitizeNormalizationMode("loud")).toBe("off");
    expect(sanitizePreampDb("4")).toBe(4);
    expect(sanitizePreampDb(20)).toBe(6);
    expect(sanitizePreampDb("x")).toBe(0);
  });
});
