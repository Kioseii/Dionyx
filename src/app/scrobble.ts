/** A play ready to send to Last.fm (also what waits in the offline queue). */
export type ScrobbleItem = {
  album?: string;
  artist: string;
  duration?: number;
  timestamp: number;
  track: string;
};

/** Last.fm rules: songs over 30 s, scrobbled after half of them or 4 minutes. */
export const MIN_SCROBBLE_DURATION_SECONDS = 30;
const MAX_THRESHOLD_SECONDS = 240;
/** Larger jumps between two readings are seeks, not listening. */
const MAX_LISTEN_STEP_SECONDS = 2;
export const MAX_QUEUED_SCROBBLES = 500;

export function isScrobbleEligible(durationSeconds: number) {
  return Number.isFinite(durationSeconds) && durationSeconds > MIN_SCROBBLE_DURATION_SECONDS;
}

export function scrobbleThreshold(durationSeconds: number) {
  return Math.min(durationSeconds / 2, MAX_THRESHOLD_SECONDS);
}

/** Seconds really listened between two readings of the play position. */
export function listenedDelta(previousTime: number, nextTime: number) {
  const delta = nextTime - previousTime;
  return delta > 0 && delta <= MAX_LISTEN_STEP_SECONDS ? delta : 0;
}

/** Builds the scrobble for a song, or null when its tags are not good enough. */
export function buildScrobbleItem(
  track: { album: string; artist: string; title: string },
  durationSeconds: number,
  startedAtSeconds: number,
): ScrobbleItem | null {
  const artist = track.artist.trim();
  const title = track.title.trim();

  if (!artist || !title || /^unknown artist$/i.test(artist)) {
    return null;
  }

  const album = track.album.trim();
  return {
    album: album && !/^unknown album$/i.test(album) ? album : undefined,
    artist,
    duration: Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : undefined,
    timestamp: Math.floor(startedAtSeconds),
    track: title,
  };
}

export type LastfmErrorKind = "not-configured" | "network" | "invalid-session" | "unauthorized-token" | "other";

/** Errors from the Rust commands look like "lastfm:<code>:<message>". */
export function classifyLastfmError(error: unknown): LastfmErrorKind {
  const text = String(error ?? "");
  if (text.startsWith("lastfm:not-configured")) return "not-configured";
  if (text.startsWith("lastfm:network")) return "network";
  // 9: invalid session key (access revoked); 4/14/15: token not approved yet or expired.
  if (text.startsWith("lastfm:9:")) return "invalid-session";
  if (/^lastfm:(4|14|15):/.test(text)) return "unauthorized-token";
  // 11/16/29: service offline, temporary error, rate limit -> retry later like a network error.
  if (/^lastfm:(11|16|29):/.test(text)) return "network";
  return "other";
}

/** Adds plays to the offline queue, keeping the newest ones if it grows too much. */
export function appendToQueue(queue: ScrobbleItem[], items: ScrobbleItem[]) {
  const merged = [...queue, ...items];
  return merged.length > MAX_QUEUED_SCROBBLES ? merged.slice(merged.length - MAX_QUEUED_SCROBBLES) : merged;
}
