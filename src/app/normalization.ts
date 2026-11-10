import type { LibraryTrack } from "./types";

export type NormalizationMode = "off" | "track" | "album";

export const NORMALIZATION_PREAMP_RANGE = { max: 6, min: -6 } as const;

/**
 * Songs without ReplayGain tags are usually modern, loud masters: tagged
 * songs typically get around -6 to -9 dB, so leaving untagged ones at 0 dB
 * would make them stand out. This brings them roughly in line.
 */
export const UNTAGGED_GAIN_DB = -6;

/** Never quieter than this, whatever the tags say. */
const MIN_FACTOR = 0.05;

export function sanitizeNormalizationMode(value: unknown): NormalizationMode {
  return value === "track" || value === "album" ? value : "off";
}

export function sanitizePreampDb(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(Math.round(number), NORMALIZATION_PREAMP_RANGE.min), NORMALIZATION_PREAMP_RANGE.max);
}

/**
 * Volume multiplier for a song so all songs play at a similar loudness.
 * Album mode keeps the loudness differences inside an album (quiet intros
 * stay quiet). The <audio> element cannot go above full volume, so the
 * result is at most 1: loud songs are turned down, quiet ones stay as they are,
 * and the peak is respected so a correction never causes clipping.
 */
export function normalizationFactor(
  track: Pick<LibraryTrack, "replayGainAlbum" | "replayGainPeak" | "replayGainTrack">,
  mode: NormalizationMode,
  preampDb: number,
) {
  if (mode === "off") return 1;

  const tagged =
    mode === "album"
      ? (track.replayGainAlbum ?? track.replayGainTrack)
      : (track.replayGainTrack ?? track.replayGainAlbum);
  const gainDb = (typeof tagged === "number" && Number.isFinite(tagged) ? tagged : UNTAGGED_GAIN_DB) + preampDb;

  let factor = 10 ** (gainDb / 20);
  const peak = track.replayGainPeak;
  if (typeof peak === "number" && peak > 0) {
    factor = Math.min(factor, 1 / peak);
  }

  return Math.min(Math.max(factor, MIN_FACTOR), 1);
}
