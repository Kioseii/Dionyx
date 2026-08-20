# Plan de modularizacion de DIONYX

Ultima actualizacion: 2026-07-29

## Objetivo

Reducir el tamaño y acoplamiento de `src/App.tsx` sin romper el pipeline actual de audio, mini player, playlists ni discover.

## Estructura objetivo

```text
src/
├── app/
│   ├── types.ts
│   ├── constants.ts
│   ├── ui.ts
│   ├── utils.ts
│   └── MODULARIZATION.md
├── components/
│   ├── sidebar/
│   ├── library/
│   ├── player/
│   ├── discover/
│   └── modals/
├── hooks/
│   ├── use-audio-player.ts
│   ├── use-playlists.ts
│   ├── use-discover.ts
│   ├── use-theme.ts
│   └── use-window-state.ts
└── App.tsx
```

## Orden correcto para extraer

### Fase 1
- Tipos
- Constantes
- Helpers puros

### Fase 2
- Modales visuales de bajo riesgo
- Paneles de settings / downloads / equalizer como componentes

### Fase 3
- Sidebar
- Tabla de biblioteca
- Panel discover
- Panel lateral de now playing / queue

### Fase 4
- Hooks de playlists
- Hooks de discover
- Hooks de personalizacion / ventana

### Fase 5
- Hook de audio principal
- Hook de ecualizador

## Regla de seguridad

El audio se toca de ultimo. Mientras tanto, `App.tsx` sigue siendo el orquestador principal y solo delega UI y helpers.

## Estado actual

### Ya extraido
- `src/app/types.ts`
- `src/app/constants.ts`
- `src/app/ui.ts`
- `src/app/utils.ts`
- `src/components/modals/PlaylistModals.tsx`
- `src/components/modals/AppModals.tsx`
- `src/components/modals/DownloadModal.tsx`
- `src/components/modals/AppModalsHost.tsx`
- `src/components/layout/AppMainStageHost.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/LibraryStatusBanner.tsx`
- `src/components/sidebar/Sidebar.tsx`
- `src/components/discover/DiscoverPanel.tsx`
- `src/components/player/DetailPanel.tsx`
- `src/components/library/LibraryPanel.tsx`
- `src/components/player/PlayerBar.tsx`
- `src/hooks/use-discover.ts`
- `src/hooks/use-app-preferences.ts`
- `src/hooks/use-window-state.ts`
- `src/hooks/use-playlists.ts` (estado, modales y CRUD base)
- `src/hooks/use-playlist-playback.ts` (acciones de playlist conectadas a playback)
- `src/hooks/use-downloads.ts` (estado, instalaciones, cola y listeners de descargas)
- `src/hooks/use-track-management.ts` (borrado de pistas, menú por pista y edición de metadata)
- `src/hooks/use-library-scan.ts` (scanning, restauración de carpeta y banner de estado)
- `src/hooks/use-playback-navigation.ts` (cola, shuffle, repeat, velocidad, navegación entre tracks y preload del siguiente audio)
- `src/hooks/use-playback-scrub.ts` (scrubbing, seek y tiempo mostrado en la barra/progreso)
- `src/hooks/use-library-view-model.ts` (filtro, orden, filas visibles, selección activa y queue rows derivados)
- `src/hooks/use-track-source.ts` (resolución de source, blob caching, source swap y preserve-position entre cambios de audio)
- `src/hooks/use-audio-playback.ts` (toggle play/pause, handlers del elemento `audio` y reproducción ligada al source resuelto)
- `src/hooks/use-persistence-sync.ts` (sync con localStorage y preferencia hide-on-tray)
- `src/hooks/use-discord-presence.ts` (Rich Presence desacoplado del componente principal)
- `src/hooks/use-overlay-controls.ts` (dismiss de menús flotantes y limpieza global del drag/drop de playlists)
- `src/hooks/use-track-duration-sync.ts` (sincroniza duración real cargada entre biblioteca y playlists guardadas)
- `src/hooks/use-library-actions.ts` (acciones de UI/biblioteca como volver a library, cerrar menú playlist y drop manual)
- `src/hooks/use-mini-player-drag.ts` (drag custom del mini player con clamp a monitores)
- `src/components/player/MiniPlayerOverlay.tsx` (mini player completo separado del contenedor principal)
- `src/components/layout/TitleBar.tsx` (titlebar custom de Tauri desacoplada de `App.tsx`)
- `src/hooks/use-equalizer.ts` (núcleo Web Audio del ecualizador: graph, refs, reset, ensure y sincronización de gains)
- `src/hooks/use-equalizer-controls.ts` (orquestación del ecualizador ligada al source resuelto: preset, toggle, bands y validación de graph)
- `src/components/player/AudioNodes.tsx` (nodos `<audio>` desacoplados del contenedor principal)
- `src/hooks/use-discover-preview-audio.ts` (handlers del preview de discover separados del contenedor principal)
- `src/hooks/use-app-shell-effects.ts` (sync liviano de volumen UI/audio y limpieza de estado visual)
- `src/hooks/use-player-visual-state.ts` (iconos derivados, theme style y label activo del preset de EQ)
- `src/hooks/use-browser-sources.ts` (lifecycle y cleanup de blob URLs generados al escanear desde navegador)
- `src/hooks/use-app-ui-actions.ts` (acciones del shell: discover, sidebar, búsqueda, paginación y menú de playlists)
- `src/hooks/use-personalization-controls.ts` (callbacks y resets del modal de personalización/settings)
- `src/hooks/use-playlist-modal-handlers.ts` (sanitización y guards para modales de playlist)
- `src/hooks/use-equalizer-modal-actions.ts` (apertura/cierre y wiring del modal de ecualizador)
- `src/hooks/use-app-async-actions.ts` (wrappers async/UI para playback, mini player, scan, metadata y downloads)
- `src/hooks/use-app-modal-props.ts` (construcción tipada de props para `AppModalsHost`)
- `src/hooks/use-player-chrome-props.ts` (construcción tipada de props para mini player, `AudioNodes` y `PlayerBar`)
- `src/hooks/use-main-stage-props.ts` (construcción tipada de props para `TopBar`, banner, discover, biblioteca y detail panel)
- `src/hooks/use-sidebar-props.ts` (construcción tipada de props para `Sidebar`)
- `src/hooks/use-playlist-library-stack.ts` (capa de composición para playlists, biblioteca filtrada/ordenada, cola, selección y navegación entre tracks)
- `src/hooks/use-library-runtime-state.ts` (estado base de biblioteca/runtime: tracks, scan, banner, playback time y búsqueda)
- `src/hooks/use-player-control-state.ts` (estado base del reproductor: volumen, modal EQ, preset y valores persistidos del ecualizador)
- `src/hooks/use-audio-runtime-stack.ts` (capa de composición para source resolution, duración real, playback HTMLAudio y wiring del ecualizador)
- `src/hooks/use-app-feature-stack.ts` (capa de composición para downloads, discover preview handlers, acciones UI y personalización/settings)
- `src/hooks/use-app-global-effects.ts` (capa de composición para persistencia, overlays, efectos del shell y Discord Presence)
- `src/hooks/use-app-host-props-stack.ts` (capa de composición para props finales de modals, sidebar, player chrome y main stage)
- `src/hooks/use-app-interaction-stack.ts` (capa de composición para handlers de playlists, modal del ecualizador y acciones async del shell)
- `src/hooks/use-player-shell-stack.ts` (capa de composición para visual state del reproductor, mini player y estado de ventana)
- `src/hooks/use-player-chrome-host-options.ts` (builder tipado para reducir el inline de `playerChromePropsOptions` antes de llegar al host principal)
- `src/hooks/use-sidebar-host-options.ts` (builder tipado para reducir el inline de `sidebarPropsOptions` y centralizar `brandName`)
- `src/app/constants.ts` ahora contiene `downloadToolsCopy` para evitar repetir ese bloque fijo en `App.tsx`
- `src/hooks/use-app-modal-host-options.ts` (builder tipado para sacar `appModalPropsOptions` del archivo principal)
- `src/hooks/use-main-stage-host-options.ts` (builder tipado para sacar `mainStagePropsOptions` del archivo principal)
- `src/hooks/use-discover-feature-stack.ts` (capa coordinadora entre `useDiscover` y `useAppFeatureStack` para sacar del shell principal la paginacion, preview y wiring de discover)

### Sigue dentro de `App.tsx`
- Orquestación superior entre audio, playlists, discover, overlays y ventana
- Wiring de hooks especializados que aún se inicializan desde el shell principal
- Ensamblaje final de props para layout, sidebar, player bar y modales
- Coordinación superior entre stacks y algunos valores derivados de render

### Siguiente corte recomendado
1. Decidir si conviene mover refs visuales y callbacks muy locales fuera de `App.tsx`; ya es optimización fina, no urgencia
2. Si no hay dolor real de mantenimiento, dar la modularización por suficientemente completa y volver a desarrollo funcional
3. Mantener la validación estricta (`tsc` + `cargo check`) después de cada corte sensible
