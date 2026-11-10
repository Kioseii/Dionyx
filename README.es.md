<div align="center">

<img src="logo.png" alt="Logo de DIONYX" width="120" />

# DIONYX

**Un reproductor de música local para tu escritorio: tus archivos, tus colores, tu sonido.**

[![Versión](https://img.shields.io/badge/versi%C3%B3n-1.5.0-8b5cf6)](../../releases/latest)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-backend-dea584?logo=rust&logoColor=black)](https://www.rust-lang.org)
![Plataforma](https://img.shields.io/badge/plataforma-Windows-555)

[English](README.md) · Español

</div>

DIONYX reproduce la música que ya tienes en tu ordenador. Lee tus carpetas, las organiza en álbumes y artistas, muestra letras sincronizadas y te deja ajustar el sonido y el aspecto de la app a tu gusto. No sube nada: tus archivos nunca salen de tu equipo.

## Funciones

### 🎧 Reproducción
- Reproduce **MP3, FLAC, WAV, AIFF, ALAC/M4A, AAC, OGG y Opus**.
- **Sin pausa entre canciones** (gapless) y **fundido cruzado** opcional (0–10 s).
- **Ecualizador de 10 bandas** con presets y **normalización de volumen** con etiquetas ReplayGain (por canción o por álbum).
- Cola, aleatorio, repetir, velocidad y **temporizador de apagado** (minutos o "al terminar la canción", con bajada suave).
- **Sigue donde lo dejaste**: misma canción, mismo segundo.
- **Atajos de teclado** para lo que más usas (Espacio, flechas, M, L, H, F...).
- **Reordena "Up next"** arrastrando.

### 📚 Biblioteca
- Vistas de álbumes, artistas y canciones, búsqueda y orden.
- Portadas y etiquetas leídas de tus archivos; **edición de metadatos** desde la app.
- Playlists manuales, con "seleccionar todas" al crearlas, e **importar y exportar M3U** (llévalas al móvil).
- **❤ Favoritas** como playlist automática.
- **Vigila tu carpeta de música**: lo que descargas o borras aparece solo.
- **Buscador de duplicados** que deja la mejor copia y manda las demás a la papelera.

### 🎤 Letras y Now Playing
- **Letras sincronizadas** (de LRCLIB o un `.lrc` junto a la canción): haz clic en una línea para saltar ahí. Se guardan para usarlas **sin conexión**.
- **Romanización** de letras en japonés.
- **Now Playing** a pantalla completa, **mini player** compacto (con fondo transparente ajustable) e icono en la bandeja.

### 🎨 A tu manera
- Elige **cualquier color de acento** o deja que **siga la portada** del disco.
- Varias fuentes, con vista previa en vivo.
- Interfaz en **español e inglés**.
- Ajustes ordenados en secciones claras, con un índice para moverte.

### 🧭 Descubrir y Last.fm
- **Artistas parecidos** a los de tu biblioteca.
- **Charts de tus gustos**: tus géneros salen de lo que escuchas (Last.fm) o de lo que tienes (biblioteca), 30 canciones por página, además del chart global.
- **Previews** de 30 segundos y **descargas** en un clic (yt-dlp + ffmpeg, instalables desde la app).
- **Scrobbling a Last.fm** con tu propia cuenta, con cola sin conexión; las ❤ Favoritas se sincronizan con tus **Loved Tracks**.
- **Discord Rich Presence** (Windows).

### 📊 Lo que escuchas
- **Estadísticas**: minutos, reproducciones, rachas, artistas y canciones más escuchados, cuándo escuchas y **"Tu año en música"**.
- Inicio muestra lo **escuchado recientemente** y lo **más escuchado**.

## Descarga

Descarga el último **`DIONYX_x.y.z_x64-setup.exe`** (Windows 10/11, 64 bits) desde [Releases](../../releases/latest). Se instala para tu usuario, sin permisos de administrador, y **se actualiza solo** cuando sale una versión nueva (puedes desactivarlo en Ajustes › Acerca de).

> **¿"Windows protegió tu PC"?** El instalador no está firmado con un certificado de pago, así que SmartScreen puede avisar la primera vez. Pulsa **Más información → Ejecutar de todas formas**. Las actualizaciones se verifican igualmente con la firma propia de DIONYX.

También puedes compilar DIONYX tú mismo (ver abajo).

## Primeros pasos

1. **Elige tu carpeta de música** en Ajustes › Biblioteca (o con el botón de la barra lateral). DIONYX la vigila, así que lo nuevo aparece solo.
2. **Opcional: conecta Last.fm** en Ajustes › Last.fm para hacer scrobbling, sincronizar las ❤ Favoritas con tus Loved Tracks y ver charts de tus gustos.
3. **Opcional: descargas**: necesitan yt-dlp y ffmpeg; se instalan con un clic en Ajustes › Descargas.

En Ajustes › Atajos de teclado tienes la lista completa de atajos.

## Privacidad

Tu música y tu historial de escucha se quedan en tu ordenador. DIONYX solo se conecta a internet para:
- **Letras** (LRCLIB), **portadas y previews** (Deezer, iTunes) y **Descubrir** (Last.fm): envía los nombres de artistas y canciones que busca.
- **Last.fm**, solo si conectas tu cuenta: lo que escuchas, para registrarlo, y tus cambios de ❤.
- **Actualizaciones**: consulta la última release de este repositorio.
- **Discord**, solo si Discord está abierto: la canción que suena, que se muestra en tu perfil.

## Compilar desde el código

**Requisitos:** [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (estable) y los [requisitos de Tauri](https://tauri.app/start/prerequisites/) de tu sistema.

```bash
npm install
npm run tauri dev      # ejecutar en desarrollo
npm run tauri build    # crear el instalador (src-tauri/target/release/bundle/nsis)
```

### Opcional: scrobbling a Last.fm

Hace falta una cuenta de API de Last.fm (gratis). Créala en [last.fm/api/account/create](https://www.last.fm/api/account/create), copia [`src-tauri/.lastfm.env.example`](src-tauri/.lastfm.env.example) como `src-tauri/.lastfm.env` y pon tu API key y tu shared secret. Ese archivo no se sube a git. Sin él la app funciona igual y la tarjeta de Last.fm en Ajustes dice "no configurado".

## Desarrollo

```bash
npx tsc --noEmit                              # comprobar tipos
npm test                                      # tests del front (Vitest)
cd src-tauri && cargo test && cargo clippy    # tests y lints del back
```

| Carpeta | Qué hay |
| --- | --- |
| `src/` | Interfaz en React + TypeScript (`components/`, `hooks/`, lógica pura en `app/`) |
| `src-tauri/` | Back end en Rust: escaneo, etiquetas, vigilancia de la carpeta, historial, caché de letras, descargas, firma de Last.fm, bandeja |
| `.github/workflows/` | Workflow de releases: compila, firma y publica el instalador de Windows |

### Publicar una versión

1. Pon la versión nueva en `package.json`, `src-tauri/tauri.conf.json` y `src-tauri/Cargo.toml`.
2. Sube una etiqueta con el mismo número: `git tag v1.5.1` y luego `git push origin v1.5.1`.
3. GitHub Actions compila el instalador firmado y publica la release con `latest.json`; las copias instaladas ofrecen la actualización.

El workflow necesita los secretos del repositorio `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (y, para tener scrobbling en las releases, `DIONYX_LASTFM_API_KEY` y `DIONYX_LASTFM_API_SECRET`).

## Créditos

Datos y servicios: [Last.fm](https://www.last.fm/api) (Descubrir y scrobbling), [LRCLIB](https://lrclib.net) (letras), [Deezer](https://developers.deezer.com) e [iTunes Search](https://performance-partners.apple.com/search-api) (portadas y previews), [yt-dlp](https://github.com/yt-dlp/yt-dlp) y [FFmpeg](https://ffmpeg.org) (descargas).

Descarga solo contenido que tengas derecho a usar.
