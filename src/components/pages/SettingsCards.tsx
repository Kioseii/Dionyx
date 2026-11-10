import { MAX_CROSSFADE_SECONDS } from "../../app/transitions";
import { NORMALIZATION_PREAMP_RANGE } from "../../app/normalization";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { FolderOpen, PictureInPicture2, SlidersHorizontal } from "lucide-react";
import { countLabel } from "../../app/library-groups";
import { isTauriRuntime } from "../../app/utils";
import { useShell } from "../layout/ShellContext";

/** Settings card: current library folder and how to change or rescan it. */
export function LibrarySettingsCard() {
  const { copy, collectionName, isScanning, libraryTrackCount, onScanFolder, scannedPath } = useShell();

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
