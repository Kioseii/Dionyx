import { useEffect, useState } from "react";
import { pickAccentFromPixels, rgbToHex } from "../app/artwork-accent";

const SAMPLE_SIZE = 32;
const cache = new Map<string, string | null>();

/**
 * Accent color taken from the cover at `src` (hex), or null while loading,
 * when disabled, without a cover, or for grey covers. Results are cached per
 * cover so going back and forth between tracks does not reload images.
 */
export function useArtworkAccent(src: string | null, enabled: boolean) {
  const [accent, setAccent] = useState<string | null>(() => (enabled && src ? cache.get(src) ?? null : null));

  useEffect(() => {
    if (!enabled || !src) {
      setAccent(null);
      return;
    }

    if (cache.has(src)) {
      setAccent(cache.get(src) ?? null);
      return;
    }

    let cancelled = false;
    const image = new Image();
    // Needed to read the pixels of asset-protocol covers (served with CORS).
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      let result: string | null = null;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (context) {
          context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
          const picked = pickAccentFromPixels(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
          result = picked ? rgbToHex(picked) : null;
        }
      } catch {
        // Tainted canvas or decode problem: keep the user's color.
        result = null;
      }

      cache.set(src, result);
      if (!cancelled) setAccent(result);
    };
    image.onerror = () => {
      cache.set(src, null);
      if (!cancelled) setAccent(null);
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [enabled, src]);

  return accent;
}
