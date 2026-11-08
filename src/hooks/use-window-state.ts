import { useEffect, useRef, useState } from "react";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import { availableMonitors, getCurrentWindow, primaryMonitor } from "@tauri-apps/api/window";
import { storageKeys } from "../app/constants";
import { isTauriRuntime, readStoredValue, writeStoredValue } from "../app/utils";
import {
  centeredRectOnMonitor,
  clampRectToMonitors,
  findMonitorForRect,
  fitRectToMonitors,
  type WindowRect,
} from "../app/window-geometry";

const DEFAULT_MAIN_WINDOW_WIDTH = 1500;
const DEFAULT_MAIN_WINDOW_HEIGHT = 860;
const MIN_VALID_MAIN_WINDOW_WIDTH = 720;
const MIN_VALID_MAIN_WINDOW_HEIGHT = 420;
const MINI_PLAYER_WIDTH = 340;
const MINI_PLAYER_HEIGHT = 120;

/** Persisted main window state, in physical pixels. */
type WindowState = WindowRect & { maximized?: boolean };

function parseWindowState(rawValue: string | null): WindowState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const value = JSON.parse(rawValue) as Partial<WindowState>;
    const numbers = [value.x, value.y, value.width, value.height];

    if (!numbers.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return null;
    }

    if ((value.width as number) < MIN_VALID_MAIN_WINDOW_WIDTH || (value.height as number) < MIN_VALID_MAIN_WINDOW_HEIGHT) {
      return null;
    }

    return {
      x: value.x as number,
      y: value.y as number,
      width: value.width as number,
      height: value.height as number,
      maximized: value.maximized === true,
    };
  } catch {
    return null;
  }
}

async function applyWindowRect(rect: WindowRect) {
  const win = getCurrentWindow();
  await win.setSize(new PhysicalSize(rect.width, rect.height));
  await win.setPosition(new PhysicalPosition(rect.x, rect.y));
}

/** Default window centred on the primary monitor, sized to fit it. */
async function getDefaultWindowRect(): Promise<WindowRect | null> {
  const primary = await primaryMonitor().catch(() => null);
  return primary
    ? centeredRectOnMonitor(primary, DEFAULT_MAIN_WINDOW_WIDTH, DEFAULT_MAIN_WINDOW_HEIGHT)
    : null;
}

type UseWindowStateOptions = {
  selectedArtist: string;
  selectedTitle: string;
};

export function useWindowState({
  selectedArtist,
  selectedTitle,
}: UseWindowStateOptions) {
  const [miniMode, setMiniMode] = useState(false);
  const [miniPinned, setMiniPinned] = useState(true);
  const [mpTitleScrolls, setMpTitleScrolls] = useState(false);
  const [mpArtistScrolls, setMpArtistScrolls] = useState(false);
  const mpInfoRef = useRef<HTMLDivElement>(null);

  // Last non-maximized, non-mini bounds of the main window.
  const savedWindowStateRef = useRef<WindowState | null>(null);
  const savedMiniPosRef = useRef<{ x: number; y: number } | null>(null);
  const miniModeRef = useRef(false);
  const windowModeTransitionRef = useRef(false);

  useEffect(() => {
    miniModeRef.current = miniMode;
  }, [miniMode]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    const savedMini = readStoredValue(storageKeys.miniPlayerPos);
    if (savedMini) {
      try {
        savedMiniPosRef.current = JSON.parse(savedMini) as { x: number; y: number };
      } catch {
        // Ignore corrupt mini-player state.
      }
    }

    writeStoredValue(storageKeys.miniMode, "false");
    setMiniMode(false);

    // Restore the previous size/position (validated against the monitors that
    // exist now), or fall back to a default window that fits the screen.
    void (async () => {
      windowModeTransitionRef.current = true;
      try {
        const win = getCurrentWindow();
        await win.setAlwaysOnTop(false);
        await win.setResizable(true);

        const saved = parseWindowState(readStoredValue(storageKeys.mainWindowState));
        const monitors = await availableMonitors().catch(() => []);
        const restored = saved
          ? fitRectToMonitors(saved, monitors, MIN_VALID_MAIN_WINDOW_WIDTH, MIN_VALID_MAIN_WINDOW_HEIGHT)
          : null;
        const target = restored ?? (await getDefaultWindowRect());

        if (target) {
          await applyWindowRect(target);
          savedWindowStateRef.current = { ...target, maximized: Boolean(restored && saved?.maximized) };
        } else {
          await win.center();
        }

        if (restored && saved?.maximized && !(await win.isMaximized())) {
          await win.toggleMaximize();
        }
      } catch {
        // Ignore window restore errors and keep startup usable.
      } finally {
        window.setTimeout(() => {
          windowModeTransitionRef.current = false;
        }, 250);
      }
    })();

    let saveTimer: ReturnType<typeof setTimeout>;
    const saveState = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        void (async () => {
          try {
            const win = getCurrentWindow();
            const [pos, size, maximized] = await Promise.all([
              win.outerPosition(),
              win.outerSize(),
              win.isMaximized(),
            ]);

            if (windowModeTransitionRef.current) {
              return;
            }

            if (miniModeRef.current) {
              savedMiniPosRef.current = { x: pos.x, y: pos.y };
              writeStoredValue(
                storageKeys.miniPlayerPos,
                JSON.stringify(savedMiniPosRef.current),
              );
              return;
            }

            // While maximized keep the last normal bounds, so un-maximizing
            // after a restart returns to them.
            const nextState: WindowState | null = maximized
              ? savedWindowStateRef.current
                ? { ...savedWindowStateRef.current, maximized: true }
                : null
              : size.width >= MIN_VALID_MAIN_WINDOW_WIDTH && size.height >= MIN_VALID_MAIN_WINDOW_HEIGHT
                ? { x: pos.x, y: pos.y, width: size.width, height: size.height, maximized: false }
                : null;

            if (!nextState) {
              return;
            }

            savedWindowStateRef.current = nextState;
            writeStoredValue(storageKeys.mainWindowState, JSON.stringify(nextState));
          } catch {
            // Ignore move/resize persistence errors.
          }
        })();
      }, 600);
    };

    let isDisposed = false;
    let unlistenMove: (() => void) | null = null;
    let unlistenResize: (() => void) | null = null;
    void (async () => {
      try {
        const win = getCurrentWindow();
        const moveListener = await win.onMoved(saveState);
        const resizeListener = await win.onResized(saveState);

        // Unmounted while registering (StrictMode): do not leak listeners.
        if (isDisposed) {
          moveListener();
          resizeListener();
          return;
        }

        unlistenMove = moveListener;
        unlistenResize = resizeListener;
      } catch {
        // Ignore event registration errors.
      }
    })();

    return () => {
      isDisposed = true;
      clearTimeout(saveTimer);
      unlistenMove?.();
      unlistenResize?.();
    };
  }, []);

  useEffect(() => {
    if (!miniMode) return;
    const container = mpInfoRef.current;
    if (!container) return;
    const maxWidth = container.clientWidth;

    const measure = (text: string, className: string) => {
      const tmp = document.createElement("span");
      tmp.className = className;
      tmp.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;font-size:inherit;font-family:inherit;font-weight:inherit";
      tmp.textContent = text;
      document.body.appendChild(tmp);
      const width = tmp.offsetWidth;
      document.body.removeChild(tmp);
      return width > maxWidth;
    };

    setMpTitleScrolls(measure(selectedTitle || "—", "mp-title"));
    setMpArtistScrolls(measure(selectedArtist || "—", "mp-artist"));
  }, [miniMode, selectedArtist, selectedTitle]);

  async function toggleMiniPin() {
    const win = getCurrentWindow();
    const next = !miniPinned;
    await win.setAlwaysOnTop(next);
    setMiniPinned(next);
  }

  async function enterMiniMode() {
    const win = getCurrentWindow();
    windowModeTransitionRef.current = true;

    try {
      const wasMaximized = await win.isMaximized();

      if (wasMaximized) {
        await win.toggleMaximize();
      }

      const [pos, size, monitors] = await Promise.all([
        win.outerPosition(),
        win.outerSize(),
        availableMonitors(),
      ]);

      if (!wasMaximized) {
        savedWindowStateRef.current = { x: pos.x, y: pos.y, width: size.width, height: size.height };
      }

      if (savedWindowStateRef.current) {
        savedWindowStateRef.current = { ...savedWindowStateRef.current, maximized: wasMaximized };
        writeStoredValue(storageKeys.mainWindowState, JSON.stringify(savedWindowStateRef.current));
      }

      // The mini player is 340x120 *logical*: convert with the scale of the
      // monitor it will sit on before clamping in physical pixels.
      const monitor = findMonitorForRect(
        { x: pos.x, y: pos.y, width: size.width, height: size.height },
        monitors,
      );
      const scale = monitor?.scaleFactor ?? 1;
      const miniWidth = Math.round(MINI_PLAYER_WIDTH * scale);
      const miniHeight = Math.round(MINI_PLAYER_HEIGHT * scale);
      const clampedMiniPos = monitor
        ? clampRectToMonitors({ x: pos.x, y: pos.y, width: miniWidth, height: miniHeight }, [monitor])
        : { x: pos.x, y: pos.y };

      savedMiniPosRef.current = clampedMiniPos;
      setMiniPinned(true);
      await win.setAlwaysOnTop(true);
      await win.setResizable(false);
      await win.setSize(new PhysicalSize(miniWidth, miniHeight));
      await win.setPosition(new PhysicalPosition(clampedMiniPos.x, clampedMiniPos.y));
      writeStoredValue(storageKeys.miniPlayerPos, JSON.stringify(savedMiniPosRef.current));
      setMiniMode(true);
    } finally {
      window.setTimeout(() => {
        windowModeTransitionRef.current = false;
      }, 250);
    }
  }

  async function exitMiniMode() {
    const win = getCurrentWindow();
    windowModeTransitionRef.current = true;

    try {
      const miniPos = await win.outerPosition();
      savedMiniPosRef.current = { x: miniPos.x, y: miniPos.y };
      writeStoredValue(storageKeys.miniPlayerPos, JSON.stringify(savedMiniPosRef.current));
      await win.setAlwaysOnTop(false);
      await win.setResizable(true);

      const saved = savedWindowStateRef.current;
      const monitors = await availableMonitors().catch(() => []);
      const restored = saved
        ? fitRectToMonitors(saved, monitors, MIN_VALID_MAIN_WINDOW_WIDTH, MIN_VALID_MAIN_WINDOW_HEIGHT)
        : null;
      const target = restored ?? (await getDefaultWindowRect());

      if (target) {
        await applyWindowRect(target);
      } else {
        await win.center();
      }

      if (restored && saved?.maximized) {
        await win.toggleMaximize();
      }

      setMiniMode(false);
    } finally {
      window.setTimeout(() => {
        windowModeTransitionRef.current = false;
      }, 250);
    }
  }

  return {
    enterMiniMode,
    exitMiniMode,
    miniMode,
    miniPinned,
    mpArtistScrolls,
    mpInfoRef,
    mpTitleScrolls,
    toggleMiniPin,
  };
}
