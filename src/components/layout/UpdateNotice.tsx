import { Download, X } from "lucide-react";
import { useShell } from "./ShellContext";

/** "New version available" bar at the top of the main area. */
export function UpdateNotice() {
  const { copy, updater } = useShell();

  if (!updater.showNotice || !updater.update) {
    return null;
  }

  const busy = updater.status === "downloading" || updater.status === "installing";
  const firstNoteLine = updater.update.notes.split("\n").map((line) => line.trim()).find(Boolean);

  return (
    <div aria-live="polite" className="update-notice" role="status">
      <Download aria-hidden="true" className="update-notice-icon" size={18} strokeWidth={2.2} />
      <div className="update-notice-text">
        <strong>
          DIONYX {updater.update.version} {copy.updateAvailable}
        </strong>
        <span className="muted">
          {updater.status === "installing"
            ? copy.updateInstalling
            : busy
              ? `${copy.updateDownloading} ${Math.round(updater.progress * 100)}%`
              : firstNoteLine ?? copy.updateHint}
        </span>
        {busy ? (
          <span className="update-notice-progress" aria-hidden="true">
            <span style={{ width: `${Math.round(updater.progress * 100)}%` }} />
          </span>
        ) : null}
      </div>
      {busy ? null : (
        <>
          <button className="update-notice-button" onClick={() => void updater.install()} type="button">
            {copy.updateInstall}
          </button>
          <button aria-label={copy.updateLater} className="update-notice-close" onClick={updater.dismiss} title={copy.updateLater} type="button">
            <X aria-hidden="true" size={15} strokeWidth={2.2} />
          </button>
        </>
      )}
    </div>
  );
}
