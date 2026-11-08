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
  const { copy, onEnterMiniMode, onOpenEqualizer } = useShell();

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
    </div>
  );
}

/** Settings card: app name and version. */
export function AboutSettingsCard() {
  const { copy } = useShell();
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
    </div>
  );
}
