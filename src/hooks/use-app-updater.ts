import { useCallback, useEffect, useRef, useState } from "react";
import { storageKeys } from "../app/constants";
import { isTauriRuntime, readStoredValue, writeStoredValue } from "../app/utils";

export type UpdaterStatus = "idle" | "checking" | "available" | "downloading" | "installing" | "up-to-date" | "error";

type UpdateInfo = { notes: string; version: string };
type PendingUpdate = Awaited<ReturnType<typeof import("@tauri-apps/plugin-updater").check>>;

const FIRST_CHECK_DELAY_MS = 5000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

/**
 * Automatic updates from GitHub Releases (tauri-plugin-updater). Checks a
 * few seconds after opening and every 6 hours; the user decides when to
 * install. Updates are signed, so a tampered installer is refused.
 */
export function useAppUpdater() {
  const [autoCheck, setAutoCheck] = useState(() => readStoredValue(storageKeys.autoUpdateCheck) !== "false");
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [dismissedVersion, setDismissedVersion] = useState(() => readStoredValue(storageKeys.updateDismissed) ?? "");
  const pendingRef = useRef<PendingUpdate>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    writeStoredValue(storageKeys.autoUpdateCheck, String(autoCheck));
  }, [autoCheck]);

  const checkNow = useCallback(async () => {
    if (!isTauriRuntime() || busyRef.current) return;
    busyRef.current = true;
    setStatus("checking");

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const found = await check();
      pendingRef.current = found;

      if (found) {
        setUpdate({ notes: found.body ?? "", version: found.version });
        setStatus("available");
      } else {
        setUpdate(null);
        setStatus("up-to-date");
      }
    } catch {
      // Offline, or no release published yet: nothing to show unless asked.
      setStatus("error");
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!autoCheck || !isTauriRuntime()) return;
    const first = window.setTimeout(() => void checkNow(), FIRST_CHECK_DELAY_MS);
    const every = window.setInterval(() => void checkNow(), CHECK_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [autoCheck, checkNow]);

  const install = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending || busyRef.current) return;
    busyRef.current = true;
    setStatus("downloading");
    setProgress(0);

    try {
      let total = 0;
      let received = 0;
      await pending.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          received += event.data.chunkLength;
          setProgress(total > 0 ? Math.min(received / total, 1) : 0);
        } else if (event.event === "Finished") {
          setProgress(1);
          setStatus("installing");
        }
      });
      // On Windows the installer closes the app itself; elsewhere restart it.
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setStatus("error");
    } finally {
      busyRef.current = false;
    }
  }, []);

  const dismiss = useCallback(() => {
    if (!update) return;
    setDismissedVersion(update.version);
    writeStoredValue(storageKeys.updateDismissed, update.version);
  }, [update]);

  return {
    autoCheck,
    checkNow,
    dismiss,
    install,
    progress,
    setAutoCheck,
    /** The notice shows for a new version unless "Later" was chosen for it. */
    showNotice:
      Boolean(update) &&
      (status === "downloading" || status === "installing" || (status === "available" && update?.version !== dismissedVersion)),
    status,
    update,
  };
}
