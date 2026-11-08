import { describe, expect, it } from "vitest";
import { pickAccentFromPixels, rgbToHex } from "./artwork-accent";

function pixels(...colors: Array<[number, number, number, number?]>) {
  return colors.flatMap(([r, g, b, a = 255]) => [r, g, b, a]);
}

function repeat(color: [number, number, number], count: number) {
  return Array.from({ length: count }, () => color);
}

describe("pickAccentFromPixels", () => {
  it("returns null for a grey cover", () => {
    expect(pickAccentFromPixels(pixels(...repeat([40, 40, 40], 50), ...repeat([200, 200, 200], 50)))).toBeNull();
  });

  it("picks the dominant vivid hue over a smaller one", () => {
    const accent = pickAccentFromPixels(
      pixels(...repeat([20, 20, 20], 60), ...repeat([200, 30, 30], 30), ...repeat([30, 30, 200], 10)),
    );
    expect(accent).not.toBeNull();
    expect(accent!.r).toBeGreaterThan(accent!.g);
    expect(accent!.r).toBeGreaterThan(accent!.b);
  });

  it("lifts a very dark color so it stays visible", () => {
    const accent = pickAccentFromPixels(pixels(...repeat([90, 10, 10], 20)));
    expect(accent).not.toBeNull();
    expect(Math.max(accent!.r, accent!.g, accent!.b)).toBeGreaterThan(150);
  });

  it("ignores transparent pixels", () => {
    expect(pickAccentFromPixels(pixels(...Array.from({ length: 20 }, () => [255, 0, 0, 0] as [number, number, number, number])))).toBeNull();
  });
});

describe("rgbToHex", () => {
  it("formats with two digits per channel", () => {
    expect(rgbToHex({ r: 1, g: 171, b: 255 })).toBe("#01abff");
  });
});
