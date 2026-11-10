import { findDuplicates, type DuplicateGroup } from "../../app/duplicates";
import { directoryOf } from "../../app/m3u";
import { MAX_CROSSFADE_SECONDS } from "../../app/transitions";
import { NORMALIZATION_PREAMP_RANGE } from "../../app/normalization";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { FolderOpen, PictureInPicture2, SlidersHorizontal } from "lucide-react";
import { countLabel } from "../../app/library-groups";
import { isTauriRuntime } from "../../app/utils";
import { useShell } from "../layout/ShellContext";

/** Settings card: current library folder and how to change or rescan it. */
export function LibrarySettingsCard() {
  const { copy, collectionName, isScanning, libraryTrackCount, onScanFolder, onToggleWatchFolder, scannedPath, watchFolder } = useShell();

  return (
    <div className="settings-card">
      <span className="font-preset-label">{copy.home}</span>
      <strong>{scannedPath ? collectionName : copy.noLibraryFolder}</strong>
      <p className="muted settings-copy settings-path" title={scannedPath ?? undefined}>
        {scannedPath ?? copy.settingsNoFolderHint}
      </p>
      <p className="muted settings-copy">
        {countLabel(libraryTrackCount, copy.trackCountSingular, copy.tracksCountLabel)}
      </p>
      <button className="settings-option" disabled={isScanning} onClick={onScanFolder} type="button">
        <FolderOpen aria-hidden="true" size={16} strokeWidth={2} />
        {isScanning ? copy.scanning : copy.settingsChooseFolder}
      </button>
      {isTauriRuntime() ? (
        <div className="transition-row watch-folder-row">
          <div>
            <span id="watch-folder-label">{copy.watchFolderLabel}</span>
            <p className="muted settings-copy">{copy.watchFolderHint}</p>
          </div>
          <button
            aria-checked={watchFolder}
            aria-labelledby="watch-folder-label"
            className={`settings-toggle ${watchFolder ? "active" : ""}`}
            onClick={onToggleWatchFolder}
            role="switch"
            type="button"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>
      ) : null}
      <LyricsCacheRow />
    </div>
  );
}

/** Settings card: shortcuts to the playback tools. */
export function PlaybackSettingsCard() {
  const { copy, normalization, onEnterMiniMode, onOpenEqualizer, playbackTransitions } = useShell();
  const { crossfadeSeconds, gapless, onCrossfadeSecondsChange, onGaplessChange } = playbackTransitions;

  return (
    <div className="settings-card">
      <span className="font-preset-label">{copy.settingsPlaybackSection}</span>
      <strong>{copy.settingsPlaybackTitle}</strong>
      <p className="muted settings-copy">{copy.settingsPlaybackHint}</p>
      <div className="settings-options">
        <button className="settings-option" onClick={onOpenEqualizer} type="button">
          <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={2} />
          {copy.equalizer}
        </button>
        <button className="settings-option" onClick={onEnterMiniMode} type="button">
          <PictureInPicture2 aria-hidden="true" size={16} strokeWidth={2} />
          {copy.miniPlayer}
        </button>
      </div>

      <div className="transition-settings">
        <div className="transition-row">
          <div>
            <strong id="gapless-label">{copy.gaplessLabel}</strong>
            <p className="muted settings-copy">{copy.gaplessHint}</p>
          </div>
          <button
            aria-checked={gapless}
            aria-labelledby="gapless-label"
            className={`settings-toggle ${gapless ? "active" : ""}`}
            onClick={() => onGaplessChange(!gapless)}
            role="switch"
            type="button"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>

        <label className="transition-row transition-row--slider" htmlFor="crossfade-range">
          <div>
            <strong>{copy.crossfadeLabel}</strong>
            <p className="muted settings-copy">{copy.crossfadeHint}</p>
          </div>
          <span className="transition-value">
            {crossfadeSeconds > 0 ? `${crossfadeSeconds} s` : copy.crossfadeOff}
          </span>
        </label>
        <input
          className="volume-slider transition-slider"
          id="crossfade-range"
          max={MAX_CROSSFADE_SECONDS}
          min={0}
          onChange={(event) => onCrossfadeSecondsChange(Number(event.currentTarget.value))}
          step={1}
          style={{ "--pct": `${(crossfadeSeconds / MAX_CROSSFADE_SECONDS) * 100}%` } as CSSProperties}
          type="range"
          value={crossfadeSeconds}
        />

        <div className="transition-row">
          <div>
            <strong id="normalization-label">{copy.normalizationLabel}</strong>
            <p className="muted settings-copy">{copy.normalizationHint}</p>
          </div>
        </div>
        <div aria-labelledby="normalization-label" className="normalization-modes" role="radiogroup">
          {(["off", "track", "album"] as const).map((value) => (
            <button
              aria-checked={normalization.mode === value}
              className={`normalization-mode${normalization.mode === value ? " active" : ""}`}
              key={value}
              onClick={() => normalization.onModeChange(value)}
              role="radio"
              type="button"
            >
              {value === "off" ? copy.normalizationOff : value === "track" ? copy.normalizationTrack : copy.normalizationAlbum}
            </button>
          ))}
        </div>
        {normalization.mode !== "off" ? (
          <>
            <label className="transition-row transition-row--slider" htmlFor="preamp-range">
              <span>{copy.normalizationPreamp}</span>
              <span className="transition-value">
                {normalization.preampDb > 0 ? `+${normalization.preampDb}` : normalization.preampDb} dB
              </span>
            </label>
            <input
              className="volume-slider transition-slider"
              id="preamp-range"
              max={NORMALIZATION_PREAMP_RANGE.max}
              min={NORMALIZATION_PREAMP_RANGE.min}
              onChange={(event) => normalization.onPreampChange(Number(event.currentTarget.value))}
              step={1}
              style={{ "--pct": `${((normalization.preampDb - NORMALIZATION_PREAMP_RANGE.min) / (NORMALIZATION_PREAMP_RANGE.max - NORMALIZATION_PREAMP_RANGE.min)) * 100}%` } as CSSProperties}
              type="range"
              value={normalization.preampDb}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Settings card: link a Last.fm account and scrobble what you listen to. */
export function LastfmSettingsCard() {
  const { copy, lastfm } = useShell();
  const connected = Boolean(lastfm.userName);

  let body;
  if (!lastfm.configured) {
    body = <p className="muted settings-copy">{copy.lastfmNotConfigured}</p>;
  } else if (connected) {
    body = (
      <>
        <p className="muted settings-copy">
          {copy.lastfmConnectedAs} <strong className="lastfm-user">{lastfm.userName}</strong>
          {lastfm.queueCount > 0 ? ` · ${lastfm.queueCount} ${copy.lastfmPending}` : ""}
        </p>
        <div className="transition-row">
          <span id="lastfm-enabled-label">{copy.lastfmScrobbleLabel}</span>
          <button
            aria-checked={lastfm.enabled}
            aria-labelledby="lastfm-enabled-label"
            className={`settings-toggle ${lastfm.enabled ? "active" : ""}`}
            onClick={() => lastfm.setEnabled(!lastfm.enabled)}
            role="switch"
            type="button"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>
        <div className="settings-options">
          <button className="settings-option" onClick={lastfm.disconnect} type="button">
            {copy.lastfmDisconnect}
          </button>
        </div>
        <p className="muted settings-copy lastfm-note">{copy.lastfmDisconnectHint}</p>
      </>
    );
  } else if (lastfm.connectState === "waiting") {
    body = (
      <>
        <p className="muted settings-copy">{copy.lastfmWaiting}</p>
        <div className="settings-options">
          <button className="settings-option" onClick={lastfm.cancelConnect} type="button">
            {copy.cancel}
          </button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <p className="muted settings-copy">
          {lastfm.connectState === "error" ? copy.lastfmError : copy.lastfmHint}
        </p>
        <div className="settings-options">
          <button className="settings-option lastfm-connect" onClick={() => void lastfm.connect()} type="button">
            {copy.lastfmConnect}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="settings-card">
      <span className="font-preset-label">Last.fm</span>
      <strong>{copy.lastfmTitle}</strong>
      {body}
    </div>
  );
}

/** Settings card: list of keyboard shortcuts (see app/shortcuts.ts). */
export function ShortcutsSettingsCard() {
  const { copy } = useShell();
  const mod = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl";
  const rows: Array<[string[], string]> = [
    [[copy.spaceKey], copy.shortcutPlayPause],
    [["←", "→"], copy.shortcutSeek],
    [[`${mod} ←`, `${mod} →`], copy.shortcutTrack],
    [[`${mod} ↑`, `${mod} ↓`], copy.shortcutVolume],
    [["M"], copy.shortcutMute],
    [["H"], copy.shortcutFavorite],
    [[`${mod} F`, "/"], copy.shortcutSearch],
    [["L"], copy.shortcutLyrics],
    [["Q"], copy.shortcutQueue],
    [["F"], copy.shortcutNowPlaying],
    [["S", "R"], copy.shortcutShuffleRepeat],
  ];

  return (
    <div className="settings-card">
      <span className="font-preset-label">{copy.shortcutsSection}</span>
      <strong>{copy.shortcutsTitle}</strong>
      <p className="muted settings-copy">{copy.shortcutsHint}</p>
      <dl className="shortcut-list">
        {rows.map(([keys, label]) => (
          <div className="shortcut-row" key={label}>
            <dt>{label}</dt>
            <dd>
              {keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Settings card: app name and version. */
export function AboutSettingsCard() {
  const { copy, updater } = useShell();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let cancelled = false;
    void import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then((value) => {
        if (!cancelled) setVersion(value);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="settings-card">
      <span className="font-preset-label">{copy.settingsAboutSection}</span>
      <strong>{version ? `DIONYX ${version}` : "DIONYX"}</strong>
      <p className="muted settings-copy">{copy.settingsAboutHint}</p>

      {isTauriRuntime() ? (
        <div className="transition-settings">
          <div className="transition-row">
            <span id="auto-update-label">{copy.updateAutoCheck}</span>
            <button
              aria-checked={updater.autoCheck}
              aria-labelledby="auto-update-label"
              className={`settings-toggle ${updater.autoCheck ? "active" : ""}`}
              onClick={() => updater.setAutoCheck(!updater.autoCheck)}
              role="switch"
              type="button"
            >
              <span className="settings-toggle-thumb" />
            </button>
          </div>
          <div className="settings-options">
            {updater.status === "available" && updater.update ? (
              <button className="settings-option lastfm-connect" onClick={() => void updater.install()} type="button">
                {copy.updateInstall} {updater.update.version}
              </button>
            ) : (
              <button
                className="settings-option"
                disabled={updater.status === "checking" || updater.status === "downloading"}
                onClick={() => void updater.checkNow()}
                type="button"
              >
                {updater.status === "checking" ? copy.updateChecking : copy.updateCheckNow}
              </button>
            )}
          </div>
          {updater.status === "up-to-date" ? <p className="muted settings-copy">{copy.updateUpToDate}</p> : null}
          {updater.status === "error" ? <p className="muted settings-copy">{copy.updateError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Settings row: lyrics saved for offline use, with a button to clear them. */
export function LyricsCacheRow() {
  const { copy } = useShell();
  const [info, setInfo] = useState<{ bytes: number; count: number } | null>(null);

  const refresh = () => {
    void import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<[number, number]>("lyrics_cache_info"))
      .then(([count, bytes]) => setInfo({ bytes, count }))
      .catch(() => setInfo(null));
  };

  useEffect(() => {
    if (isTauriRuntime()) refresh();
  }, []);

  if (!isTauriRuntime() || !info) return null;

  return (
    <div className="transition-row lyrics-cache-row">
      <span className="muted settings-copy">
        {copy.lyricsCacheLabel}: {info.count} · {(info.bytes / (1024 * 1024)).toFixed(1)} MB
      </span>
      <button
        className="settings-option"
        disabled={info.count === 0}
        onClick={() => {
          void import("@tauri-apps/api/core")
            .then(({ invoke }) => invoke("lyrics_cache_clear"))
            .finally(refresh);
        }}
        type="button"
      >
        {copy.lyricsCacheClear}
      </button>
    </div>
  );
}

/** Settings card: the same song saved more than once; extra copies can go to the Recycle Bin. */
export function DuplicatesSettingsCard() {
  const { copy, libraryTracks, onRescanQuietly, watchFolder } = useShell();
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [busyPath, setBusyPath] = useState<string | null>(null);

  const search = () => setGroups(findDuplicates(libraryTracks));

  const moveToTrash = async (path: string) => {
    const [{ ask }, { invoke }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/api/core")]);
    const confirmed = await ask(`${copy.duplicatesConfirm}\n\n${path}`, { kind: "warning", title: copy.duplicatesTitle });
    if (!confirmed) return;
    setBusyPath(path);
    try {
      await invoke("trash_track_file", { path });
      // The folder watcher rescans by itself; without it, rescan now.
      if (!watchFolder) await onRescanQuietly();
      setGroups((current) =>
        current
          ?.map((group) => ({ ...group, indices: group.indices.filter((index) => libraryTracks[index]?.path !== path) }))
          .filter((group) => group.indices.length > 1) ?? null,
      );
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <div className="settings-card">
      <span className="font-preset-label">{copy.duplicatesSection}</span>
      <strong>{copy.duplicatesTitle}</strong>
      <p className="muted settings-copy">{copy.duplicatesHint}</p>
      <div className="settings-options">
        <button className="settings-option" disabled={libraryTracks.length === 0} onClick={search} type="button">
          {groups ? copy.duplicatesSearchAgain : copy.duplicatesSearch}
        </button>
      </div>

      {groups && groups.length === 0 ? <p className="muted settings-copy">{copy.duplicatesNone}</p> : null}
      {groups && groups.length > 0 ? (
        <div className="duplicate-groups">
          <p className="muted settings-copy">
            {copy.duplicatesFound}: {groups.length}
          </p>
          {groups.slice(0, 60).map((group) => (
            <div className="duplicate-group" key={group.indices.join("-")}>
              <strong>
                {group.artist} — {group.title}
              </strong>
              {group.indices.map((index, position) => {
                const track = libraryTracks[index];
                if (!track) return null;
                return (
                  <div className="duplicate-copy" key={track.path}>
                    <span className="format-pill">{track.format}</span>
                    <span className="duplicate-folder" title={track.path}>
                      {directoryOf(track.path)}
                    </span>
                    {position === 0 ? (
                      <span className="duplicate-best">{copy.duplicatesBest}</span>
                    ) : isTauriRuntime() ? (
                      <button
                        className="settings-option duplicate-trash"
                        disabled={busyPath !== null}
                        onClick={() => void moveToTrash(track.path)}
                        type="button"
                      >
                        {busyPath === track.path ? copy.duplicatesMoving : copy.duplicatesTrash}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const SETTINGS_SECTIONS = [
  "settings-general",
  "settings-library",
  "settings-playback",
  "settings-mini",
  "settings-lastfm",
  "settings-shortcuts",
  "settings-downloads",
  "settings-about",
] as const;

/** One titled group of settings. */
export function SettingsSection({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="settings-section" id={id}>
      <h2 className="settings-section-title" id={`${id}-title`}>{title}</h2>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

/** Index on the left: jumps to a section and marks the one in view. */
export function SettingsNav() {
  const { copy } = useShell();
  const [active, setActive] = useState<string>(SETTINGS_SECTIONS[0]);
  const labels: Record<(typeof SETTINGS_SECTIONS)[number], string> = {
    "settings-about": copy.settingsAboutSection,
    "settings-downloads": copy.downloadsNav,
    "settings-general": copy.settingsGeneral,
    "settings-lastfm": "Last.fm",
    "settings-library": copy.settingsLibrary,
    "settings-mini": copy.miniPlayer,
    "settings-playback": copy.settingsPlaybackSection,
    "settings-shortcuts": copy.shortcutsSection,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    SETTINGS_SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label={copy.settingsNav} className="settings-nav">
      {SETTINGS_SECTIONS.map((id) => (
        <button
          aria-current={active === id ? "true" : undefined}
          className={`settings-nav-item${active === id ? " active" : ""}`}
          key={id}
          onClick={() => {
            setActive(id);
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          type="button"
        >
          {labels[id]}
        </button>
      ))}
    </nav>
  );
}

/** Mini player: how see-through its background is. */
export function MiniPlayerSettingsCard() {
  const { copy, miniOpacity, onEnterMiniMode, onMiniOpacityChange } = useShell();
  const percent = Math.round(miniOpacity * 100);

  return (
    <div className="settings-card">
      <label className="transition-row transition-row--slider" htmlFor="mini-opacity-range">
        <div>
          <strong>{copy.miniOpacityLabel}</strong>
          <p className="muted settings-copy">{copy.miniOpacityHint}</p>
        </div>
        <span className="transition-value">{percent}%</span>
      </label>
      <input
        className="volume-slider transition-slider"
        id="mini-opacity-range"
        max={100}
        min={30}
        onChange={(event) => onMiniOpacityChange(Number(event.currentTarget.value) / 100)}
        step={5}
        style={{ "--pct": `${((percent - 30) / 70) * 100}%` } as CSSProperties}
        type="range"
        value={percent}
      />
      <div className="settings-options">
        <button className="settings-option" onClick={onEnterMiniMode} type="button">
          <PictureInPicture2 aria-hidden="true" size={16} strokeWidth={2} />
          {copy.miniPlayer}
        </button>
      </div>
    </div>
  );
}
