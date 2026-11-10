/** Crossfade length range offered in Settings (seconds; 0 = off). */
export const MAX_CROSSFADE_SECONDS = 10;

/**
 * Gapless: how long before the end the previous song moves to the tail
 * element, giving the next one time to load while it finishes.
 */
export const GAPLESS_LEAD_SECONDS = 1;

export type TransitionMode = "off" | "gapless" | "crossfade";

export function getTransitionMode(gapless: boolean, crossfadeSeconds: number): TransitionMode {
  if (crossfadeSeconds > 0) return "crossfade";
  return gapless ? "gapless" : "off";
}

export function getTransitionLead(mode: TransitionMode, crossfadeSeconds: number) {
  if (mode === "crossfade") return crossfadeSeconds;
  if (mode === "gapless") return GAPLESS_LEAD_SECONDS;
  return 0;
}

export function sanitizeCrossfadeSeconds(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(Math.round(number), 0), MAX_CROSSFADE_SECONDS) : 0;
}

type TransitionCheck = {
  currentTime: number;
  duration: number;
  hasNextTrack: boolean;
  lead: number;
  mode: TransitionMode;
  /** Repeat-one, sleep timer "end of song", paused, seeking... */
  blocked: boolean;
};

/**
 * Whether the song is close enough to its end to start the transition.
 * Short songs (under 3× the lead) are left alone so a crossfade never eats
 * most of a track.
 */
export function shouldStartTransition({ blocked, currentTime, duration, hasNextTrack, lead, mode }: TransitionCheck) {
  if (mode === "off" || blocked || !hasNextTrack || lead <= 0) return false;
  if (!Number.isFinite(duration) || duration < lead * 3) return false;

  const remaining = duration - currentTime;
  // Too close to the end to hand over cleanly: let it end normally.
  return remaining <= lead && remaining > 0.25;
}

/**
 * Equal-power crossfade: at `progress` 0..1 returns the volume factors for the
 * song coming in and the one going out (their power always adds up to 1, so
 * the loudness does not dip in the middle).
 */
export function crossfadeGains(progress: number) {
  const p = Math.min(Math.max(progress, 0), 1);
  return {
    incoming: Math.sin((p * Math.PI) / 2),
    outgoing: Math.cos((p * Math.PI) / 2),
  };
}
