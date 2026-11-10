import { invoke } from "@tauri-apps/api/core";
import type { LastFmTrack } from "./types";

const LASTFM_ROOT = "https://ws.audioscrobbler.com/2.0/";
/** Public read-only key used by Discover (scrobbling uses its own signed key in Rust). */
export const LASTFM_PUBLIC_API_KEY = "dc64b190b7e51f9c9d474d902ff67263";

/** Unsigned Last.fm read (goes through the Rust `fetch_url` to avoid CORS). */
export async function lastfmPublicGet<T = unknown>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ ...params, api_key: LASTFM_PUBLIC_API_KEY, format: "json" }).toString();
  const body = await invoke<string>("fetch_url", { url: `${LASTFM_ROOT}?${query}` });
  const parsed = JSON.parse(body) as T & { error?: number };

  if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
    throw new Error(`lastfm:${parsed.error}`);
  }

  return parsed;
}

export function getLastfmTrackArtist(track: LastFmTrack) {
  return typeof track.artist === "string" ? track.artist : track.artist?.name ?? "";
}
