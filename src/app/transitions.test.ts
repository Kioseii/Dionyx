import { describe, expect, it } from "vitest";
import {
  crossfadeGains,
  getTransitionLead,
  getTransitionMode,
  sanitizeCrossfadeSeconds,
  shouldStartTransition,
} from "./transitions";

const base = { blocked: false, currentTime: 0, duration: 200, hasNextTrack: true, lead: 5, mode: "crossfade" as const };

describe("transition mode", () => {
  it("crossfade wins over gapless, and both can be off", () => {
    expect(getTransitionMode(true, 4)).toBe("crossfade");
    expect(getTransitionMode(true, 0)).toBe("gapless");
    expect(getTransitionMode(false, 0)).toBe("off");
    expect(getTransitionLead("crossfade", 6)).toBe(6);
    expect(getTransitionLead("off", 6)).toBe(0);
  });

  it("clamps stored crossfade values", () => {
    expect(sanitizeCrossfadeSeconds("4")).toBe(4);
    expect(sanitizeCrossfadeSeconds(99)).toBe(10);
    expect(sanitizeCrossfadeSeconds("nope")).toBe(0);
    expect(sanitizeCrossfadeSeconds(-3)).toBe(0);
  });
});

describe("shouldStartTransition", () => {
  it("starts inside the last `lead` seconds", () => {
    expect(shouldStartTransition({ ...base, currentTime: 194 })).not.toBe(true);
    expect(shouldStartTransition({ ...base, currentTime: 195.5 })).toBe(true);
  });

  it("does nothing when off, blocked, last in queue or right at the end", () => {
    expect(shouldStartTransition({ ...base, currentTime: 197, mode: "off" })).toBe(false);
    expect(shouldStartTransition({ ...base, blocked: true, currentTime: 197 })).toBe(false);
    expect(shouldStartTransition({ ...base, currentTime: 197, hasNextTrack: false })).toBe(false);
    expect(shouldStartTransition({ ...base, currentTime: 199.9 })).toBe(false);
  });

  it("skips songs too short for the fade", () => {
    expect(shouldStartTransition({ ...base, currentTime: 12, duration: 14 })).toBe(false);
  });
});

describe("crossfadeGains", () => {
  it("goes from all-outgoing to all-incoming with constant power", () => {
    expect(crossfadeGains(0)).toEqual({ incoming: 0, outgoing: 1 });
    const middle = crossfadeGains(0.5);
    expect(middle.incoming ** 2 + middle.outgoing ** 2).toBeCloseTo(1);
    expect(crossfadeGains(1).incoming).toBeCloseTo(1);
    expect(crossfadeGains(2).outgoing).toBeCloseTo(0);
  });
});
