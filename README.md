<div align="center">

<img src="logo.png" alt="DIONYX logo" width="120" />

# DIONYX

**A local music player for your desktop: your files, your colors, your sound.**

[![Version](https://img.shields.io/badge/version-1.4.1-8b5cf6)](CONTEXT.md)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-backend-dea584?logo=rust&logoColor=black)](https://www.rust-lang.org)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-555)

English · [Español](README.es.md)

</div>

<!--
  Screenshots: save them in docs/screenshots/ and uncomment, e.g.
  <p align="center"><img src="docs/screenshots/library.png" width="860" alt="Library view" /></p>
-->

DIONYX plays the music you already have on your computer. It reads your folders, organizes them into albums and artists, shows synced lyrics, and lets you shape the sound and the look of the app to your taste. Nothing is uploaded: your files never leave your machine.

## Features

### 🎧 Playback
- Plays **MP3, FLAC, WAV, AIFF, ALAC/M4A, AAC, OGG and Opus**.
- **Gapless playback** and an optional **crossfade** (0–10 s).
- **10-band equalizer** with presets.
- Queue, shuffle, repeat, playback speed and a **sleep timer** (minutes or "end of song", with a soft fade-out).
- **Picks up where you left off**: same song, same second.
- **Keyboard shortcuts** for everything you use often (Space, arrows, M, L, F...).

### 📚 Library
- Albums, artists and songs views, search and sorting.
- Covers and tags read from your files; **edit metadata** from the app.
- Manual playlists, with "select all" when building them.

### 🎤 Lyrics & Now Playing
- **Synced lyrics** (via LRCLIB): click any line to jump there.
- **Romanization** for Japanese lyrics.
- Full-screen **Now Playing**, a compact **mini player** and a tray icon.

### 🎨 Make it yours
- Pick **any accent color**, or let it **follow the album cover**.
- Several font presets, with a live preview.
- Interface in **English and Spanish**.

### 🧭 Discover & Last.fm
- **Similar artists** to the ones in your library.
- **Charts from your own taste**: your genres are worked out from what you listen to (Last.fm) or what you own (library), 30 songs per page, plus the global chart.
- 30-second **previews** and one-click **downloads** (yt-dlp + ffmpeg, installed from the app).
- **Last.fm scrobbling** with your own account, including an offline queue.
- **Discord Rich Presence** (Windows).

## Download

Prebuilt installers are not published yet. You can build DIONYX yourself in a few minutes (see below).

## Build from source

**Requirements:** [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (stable) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
npm install
npm run tauri dev      # run in development
npm run tauri build    # create the installer (src-tauri/target/release/bundle)
```

For macOS (private, unsigned build) see [MACOS_PRIVATE_BUILD.md](MACOS_PRIVATE_BUILD.md).

### Optional: Last.fm scrobbling

Scrobbling needs a Last.fm API account (free). Create one at [last.fm/api/account/create](https://www.last.fm/api/account/create), then copy [`src-tauri/.lastfm.env.example`](src-tauri/.lastfm.env.example) to `src-tauri/.lastfm.env` and fill in your key and shared secret. That file is ignored by git. Without it the app works normally and the Last.fm card in Settings shows "not configured".

## Development

```bash
npx tsc --noEmit                              # type check
npm test                                      # front-end tests (Vitest)
cd src-tauri && cargo test && cargo clippy    # back-end tests and lints
```

| Folder | What lives there |
| --- | --- |
| `src/` | React + TypeScript interface (`components/`, `hooks/`, pure logic in `app/`) |
| `src-tauri/` | Rust back end: library scan, tags, downloads, Last.fm signing, tray |
| `CONTEXT.md` | Project status, technical decisions and audio rules |

## Credits

Data and services: [Last.fm](https://www.last.fm/api) (Discover and scrobbling), [LRCLIB](https://lrclib.net) (lyrics), [Deezer](https://developers.deezer.com) and [iTunes Search](https://performance-partners.apple.com/search-api) (covers and previews), [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org) (downloads).

Download only content you have the right to use.
