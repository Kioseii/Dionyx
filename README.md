<div align="center">

<img src="logo.png" alt="DIONYX logo" width="120" />

# DIONYX

**A local music player for your desktop: your files, your colors, your sound.**

[![Version](https://img.shields.io/badge/version-1.5.0-8b5cf6)](../../releases/latest)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-backend-dea584?logo=rust&logoColor=black)](https://www.rust-lang.org)
![Platform](https://img.shields.io/badge/platform-Windows-555)

English · [Español](README.es.md)

</div>

<!--
  Screenshots: save them in assets/screenshots/ and uncomment, e.g.
  <p align="center"><img src="assets/screenshots/library.png" width="860" alt="Library view" /></p>
-->

DIONYX plays the music you already have on your computer. It reads your folders, organizes them into albums and artists, shows synced lyrics, and lets you shape the sound and the look of the app to your taste. Nothing is uploaded: your files never leave your machine.

## Features

### 🎧 Playback
- Plays **MP3, FLAC, WAV, AIFF, ALAC/M4A, AAC, OGG and Opus**.
- **Gapless playback** and an optional **crossfade** (0–10 s).
- **10-band equalizer** with presets, and **volume normalization** from ReplayGain tags (by song or by album).
- Queue, shuffle, repeat, playback speed and a **sleep timer** (minutes or "end of song", with a soft fade-out).
- **Picks up where you left off**: same song, same second.
- **Keyboard shortcuts** for everything you use often (Space, arrows, M, L, H, F...).
- Drag to **reorder "Up next"**.

### 📚 Library
- Albums, artists and songs views, search and sorting.
- Covers and tags read from your files; **edit metadata** from the app.
- Manual playlists, with "select all" when building them, plus **M3U import and export** (take them to your phone).
- **❤ Favorites** as an automatic playlist.
- **Watches your music folder**: new downloads or deleted files show up on their own.
- **Duplicate finder** that keeps the best copy and moves the rest to the Recycle Bin.

### 🎤 Lyrics & Now Playing
- **Synced lyrics** (via LRCLIB or a `.lrc` next to the song): click any line to jump there. Saved for **offline** use.
- **Romanization** for Japanese lyrics.
- Full-screen **Now Playing**, a compact **mini player** (with adjustable see-through background) and a tray icon.

### 🎨 Make it yours
- Pick **any accent color**, or let it **follow the album cover**.
- Several font presets, with a live preview.
- Interface in **English and Spanish**.
- Settings organized in clear sections, with an index to jump around.

### 🧭 Discover & Last.fm
- **Similar artists** to the ones in your library.
- **Charts from your own taste**: your genres are worked out from what you listen to (Last.fm) or what you own (library), 30 songs per page, plus the global chart.
- 30-second **previews** and one-click **downloads** (yt-dlp + ffmpeg, installed from the app).
- **Last.fm scrobbling** with your own account, including an offline queue; ❤ Favorites sync with your **Loved Tracks**.
- **Discord Rich Presence** (Windows).

### 📊 Your listening
- **Statistics**: minutes, plays, streaks, top artists and songs, when you listen, and **"Your year in music"**.
- Home shows **recently played** and **most played** songs.

## Download

Get the latest **`DIONYX_x.y.z_x64-setup.exe`** (Windows 10/11, 64-bit) from the [Releases](../../releases/latest) page. It installs for your user, no admin rights needed, and **updates itself** when a new version comes out (you can turn that off in Settings › About).

> **"Windows protected your PC"?** The installer is not signed with a paid code-signing certificate, so SmartScreen may warn the first time. Click **More info → Run anyway**. Updates are still verified with DIONYX's own signature.

You can also build DIONYX yourself (see below).

## Getting started

1. **Choose your music folder** in Settings › Library (or the button in the sidebar). DIONYX keeps watching it, so new files appear on their own.
2. **Optional: connect Last.fm** in Settings › Last.fm to scrobble, sync ❤ Favorites with your Loved Tracks and get charts from your own taste.
3. **Optional: downloads** need yt-dlp and ffmpeg; install them with one click in Settings › Downloads.

Settings › Keyboard shortcuts lists every shortcut.

## Privacy

Your music and your listening history stay on your computer. DIONYX only goes online for:
- **Lyrics** (LRCLIB), **covers and previews** (Deezer, iTunes) and **Discover** (Last.fm): it sends the artist and song names it looks up.
- **Last.fm**, only if you connect your account: what you play, to scrobble it, and your ❤ changes.
- **Updates**: it checks this repository's latest release.
- **Discord**, only if Discord is open: the song you are playing, shown on your profile.

## Build from source

**Requirements:** [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (stable) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
npm install
npm run tauri dev      # run in development
npm run tauri build    # create the installer (src-tauri/target/release/bundle/nsis)
```

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
| `src-tauri/` | Rust back end: library scan, tags, folder watcher, history, lyrics cache, downloads, Last.fm signing, tray |
| `.github/workflows/` | Release workflow: builds, signs and publishes the Windows installer |

### Publishing a version

1. Set the new version in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`.
2. Push a tag with the same number: `git tag v1.5.1` then `git push origin v1.5.1`.
3. GitHub Actions builds the signed installer and publishes the release with `latest.json`; installed copies offer the update.

The workflow needs the repository secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (and, for scrobbling in releases, `DIONYX_LASTFM_API_KEY` and `DIONYX_LASTFM_API_SECRET`).

## Credits

Data and services: [Last.fm](https://www.last.fm/api) (Discover and scrobbling), [LRCLIB](https://lrclib.net) (lyrics), [Deezer](https://developers.deezer.com) and [iTunes Search](https://performance-partners.apple.com/search-api) (covers and previews), [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org) (downloads).

Download only content you have the right to use.
