import { describe, expect, it } from "vitest";
import {
  centeredRectOnMonitor,
  clampRectToMonitors,
  findMonitorForRect,
  fitRectToMonitors,
  type MonitorRect,
} from "./window-geometry";

// Laptop 1920x1080 @150% on the left, 2560x1440 @100% on the right, aligned top.
const laptop: MonitorRect = { position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 }, scaleFactor: 1.5 };
const desktop: MonitorRect = { position: { x: 1920, y: 0 }, size: { width: 2560, height: 1440 }, scaleFactor: 1 };
const monitors = [laptop, desktop];

describe("findMonitorForRect", () => {
  it("picks the monitor that holds the window centre", () => {
    expect(findMonitorForRect({ x: 2000, y: 100, width: 500, height: 300 }, monitors)).toBe(desktop);
    expect(findMonitorForRect({ x: 1800, y: 100, width: 200, height: 100 }, monitors)).toBe(laptop);
  });

  it("falls back to the nearest monitor for a centre in a gap", () => {
    // Below the laptop (which is shorter than the desktop monitor).
    expect(findMonitorForRect({ x: 100, y: 1200, width: 300, height: 100 }, monitors)).toBe(laptop);
  });

  it("returns null without monitors", () => {
    expect(findMonitorForRect({ x: 0, y: 0, width: 1, height: 1 }, [])).toBeNull();
  });
});

describe("clampRectToMonitors", () => {
  it("never leaves a window in the gap the bounding box would allow", () => {
    // The old union-box clamp accepted y=1200 here (inside 0..1440) although
    // the laptop screen ends at 1080.
    expect(clampRectToMonitors({ x: 100, y: 1200, width: 510, height: 180 }, monitors)).toEqual({ x: 100, y: 900 });
  });

  it("lets the window move to the other screen once its centre crosses", () => {
    expect(clampRectToMonitors({ x: 1800, y: 50, width: 340, height: 120 }, monitors)).toEqual({ x: 1920, y: 50 });
  });
});

describe("fitRectToMonitors", () => {
  it("shrinks a saved window that no longer fits and moves it on screen", () => {
    expect(fitRectToMonitors({ x: 5000, y: 50, width: 3000, height: 2000 }, monitors, 720, 420)).toEqual({
      x: 1920,
      y: 0,
      width: 2560,
      height: 1440,
    });
  });

  it("keeps a valid window untouched", () => {
    const rect = { x: 2100, y: 100, width: 1500, height: 860 };
    expect(fitRectToMonitors(rect, monitors, 720, 420)).toEqual(rect);
  });

  it("enforces the minimum size", () => {
    expect(fitRectToMonitors({ x: 10, y: 10, width: 100, height: 100 }, monitors, 720, 420)).toMatchObject({
      width: 720,
      height: 420,
    });
  });
});

describe("centeredRectOnMonitor", () => {
  it("uses the monitor scale and never exceeds 92% of the screen", () => {
    // 1500x860 logical at 150% = 2250x1290 physical: too big for 1920x1080.
    expect(centeredRectOnMonitor(laptop, 1500, 860)).toEqual({ x: 77, y: 43, width: 1766, height: 994 });
    expect(centeredRectOnMonitor(desktop, 1500, 860)).toEqual({ x: 2450, y: 290, width: 1500, height: 860 });
  });
});
