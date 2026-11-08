type Rgb = { r: number; g: number; b: number };

const HUE_BUCKETS = 12;
const MIN_SATURATION = 0.25;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.9;
/** Share of the image (by weight) the winning hue must cover, else null. */
const MIN_COVERAGE = 0.04;

function rgbToHsl({ r, g, b }: Rgb) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }

  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Picks an accent color from raw RGBA pixels (e.g. a small canvas of the
 * cover): the most present vivid hue, averaged, then nudged so it reads well
 * on the dark UI. Returns null for grey/black-and-white covers so the user's
 * own color stays in use.
 */
export function pickAccentFromPixels(data: ArrayLike<number>): Rgb | null {
  const weights = new Array<number>(HUE_BUCKETS).fill(0);
  const sums = Array.from({ length: HUE_BUCKETS }, () => ({ r: 0, g: 0, b: 0 }));
  let totalWeight = 0;

  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const { h, s, l } = rgbToHsl(pixel);
    totalWeight += 1;

    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;

    // Vivid, mid-light pixels count more than washed-out ones.
    const weight = s * (1 - Math.abs(l - 0.5));
    const bucket = Math.floor(h / (360 / HUE_BUCKETS)) % HUE_BUCKETS;
    weights[bucket] += weight;
    sums[bucket].r += pixel.r * weight;
    sums[bucket].g += pixel.g * weight;
    sums[bucket].b += pixel.b * weight;
  }

  let best = -1;
  for (let i = 0; i < HUE_BUCKETS; i += 1) {
    if (weights[i] > 0 && (best < 0 || weights[i] > weights[best])) best = i;
  }

  if (best < 0 || totalWeight === 0 || weights[best] / totalWeight < MIN_COVERAGE) {
    return null;
  }

  const average = {
    r: sums[best].r / weights[best],
    g: sums[best].g / weights[best],
    b: sums[best].b / weights[best],
  };
  const { h, s, l } = rgbToHsl(average);

  // Keep it lively and visible on near-black surfaces.
  return hslToRgb(h, Math.min(Math.max(s, 0.45), 0.9), Math.min(Math.max(l, 0.45), 0.68));
}

export function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
