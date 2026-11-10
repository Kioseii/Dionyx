# DIONYX

Reproductor de música local de escritorio (Windows y macOS) hecho con Tauri 2, React 19, TypeScript y Rust.

Biblioteca local con metadatos y portadas, playlists manuales, ecualizador de 10 bandas (Web Audio), letras sincronizadas con romanización, Discover (Last.fm + iTunes), descargas con yt-dlp + ffmpeg, mini player y Discord Rich Presence (Windows).

## Desarrollo

```bash
npm install
npm run tauri dev
```

## Comprobaciones

```bash
npx tsc --noEmit
npm test
cd src-tauri && cargo test && cargo clippy
```

## Builds

- Windows: `npm run tauri build`
- macOS (privada, sin firmar): ver [MACOS_PRIVATE_BUILD.md](MACOS_PRIVATE_BUILD.md)

El estado del proyecto, las decisiones técnicas y las reglas del audio están en [CONTEXT.md](CONTEXT.md).
