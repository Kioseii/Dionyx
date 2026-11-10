import type { LibraryTrack } from "./types";

/** Forward slashes, no "." / ".." segments, no trailing slash. */
export function normalizePath(path: string) {
  const unified = path.replace(/\\/g, "/");
  const prefix = unified.match(/^([a-zA-Z]:\/|\/\/|\/)/)?.[0] ?? "";
  const parts: string[] = [];
  for (const part of unified.slice(prefix.length).split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return prefix + parts.join("/");
}

const isAbsolute = (path: string) => /^([a-zA-Z]:[\\/]|[\\/])/.test(path);
/** Windows paths ignore case; comparing that way is harmless elsewhere. */
const pathKey = (path: string) => normalizePath(path).toLowerCase();

export function directoryOf(filePath: string) {
  const normalized = normalizePath(filePath);
  const cut = normalized.lastIndexOf("/");
  return cut > 0 ? normalized.slice(0, cut) : normalized;
}

function durationSeconds(duration: string) {
  const match = /^(\d+):(\d{2})$/.exec(duration);
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
}

/**
 * Extended M3U (UTF-8, for a .m3u8 file). Songs inside the folder where the
 * playlist is saved get relative paths, so the folder can be copied as a
 * whole (e.g. to a phone); the rest keep their absolute path.
 */
export function buildM3u(tracks: LibraryTrack[], m3uFilePath: string) {
  const baseKey = pathKey(directoryOf(m3uFilePath)) + "/";
  const lines = ["#EXTM3U"];

  for (const track of tracks) {
    if (!track.path) continue;
    const normalized = normalizePath(track.path);
    const location = normalized.toLowerCase().startsWith(baseKey) ? normalized.slice(baseKey.length) : track.path;
    lines.push(`#EXTINF:${durationSeconds(track.duration)},${track.artist} - ${track.title}`);
    lines.push(location);
  }

  return lines.join("\r\n") + "\r\n";
}

/** Song locations in an M3U/M3U8 file, resolved against the file's folder. */
export function parseM3u(text: string, m3uFilePath: string) {
  const base = directoryOf(m3uFilePath);
  return text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      let location = line;
      if (/^file:\/\//i.test(location)) {
        location = decodeURIComponent(location.replace(/^file:\/\/\/?/i, ""));
        if (!/^[a-zA-Z]:/.test(location) && !location.startsWith("/")) location = `/${location}`;
      }
      return normalizePath(isAbsolute(location) ? location : `${base}/${location}`);
    });
}

/**
 * Library songs for the playlist's entries, in order: by full path, or else
 * by file name (the playlist came from another computer or folder).
 */
export function matchM3uToLibrary(locations: string[], library: LibraryTrack[]) {
  const byPath = new Map<string, LibraryTrack>();
  const byName = new Map<string, LibraryTrack>();
  for (const track of library) {
    if (!track.path) continue;
    byPath.set(pathKey(track.path), track);
    const name = pathKey(track.path).split("/").pop();
    if (name && !byName.has(name)) byName.set(name, track);
  }

  const matched: LibraryTrack[] = [];
  const missing: string[] = [];
  for (const location of locations) {
    const key = pathKey(location);
    const track = byPath.get(key) ?? byName.get(key.split("/").pop() ?? "");
    if (track) matched.push(track);
    else missing.push(location);
  }
  return { matched, missing };
}

/** Playlist name from the file name ("Road trip.m3u8" -> "Road trip"). */
export function playlistNameFromFile(filePath: string) {
  const name = normalizePath(filePath).split("/").pop() ?? "";
  return name.replace(/\.m3u8?$/i, "").trim() || "Playlist";
}
