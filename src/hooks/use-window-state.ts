import { useEffect, useRef, useState } from "react";
import { LogicalSize, PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import { availableMonitors, getCurrentWindow, monitorFromPoint, primaryMonitor } from "@tauri-apps/api/window";
import { storageKeys } from "../app/constants";
import { clampToDesktopBounds, isTauriRuntime, writeStoredValue, readStoredValue } from "../app/utils";

const DEFAULT_MAIN_WINDOW_WIDTH = 1500;
const DEFAULT_MAIN_WINDOW_HEIGHT = 860;
const MIN_VALID_MAIN_WINDOW_WIDTH = 720;
const MIN_VALID_MAIN_WINDOW_HEIGHT = 420;

type WindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function isValidMainWindowState(
  value: WindowState | null | undefined,
) {
  return Boolean(
    value &&
    value.width >= MIN_VALID_MAIN_WINDOW_WIDTH &&
    value.height >= MIN_VALID_MAIN_WINDOW_HEIGHT,
  );
}

function getCenteredMainWindowState(
  monitor: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    scaleFactor?: number;
  } | null,
): WindowState {
  if (!monitor) {
    return {
      x: 0,
      y: 0,
      width: DEFAULT_MAIN_WINDOW_WIDTH,
      height: DEFAULT_MAIN_WINDOW_HEIGHT,
    };
  }

  const scaleFactor = monitor.scaleFactor ?? 1;
  const physicalWidth = Math.round(DEFAULT_MAIN_WINDOW_WIDTH * scaleFactor);
  const physicalHeight = Math.round(DEFAULT_MAIN_WINDOW_HEIGHT * scaleFactor);

  return {
    x: monitor.position.x + Math.max(0, Math.round((monitor.size.width - physicalWidth) / 2)),
    y: monitor.position.y + Math.max(0, Math.round((monitor.size.height - physicalHeight) / 2)),
    width: DEFAULT_MAIN_WINDOW_WIDTH,
    height: DEFAULT_MAIN_WINDOW_HEIGHT,
  };
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

    void (async () => {
      try {
        const win = getCurrentWindow();
        const primary = await primaryMonitor().catch(() => null);
        const defaultState = getCenteredMainWindowState(primary);

        savedWindowStateRef.current = defaultState;
        await win.setAlwaysOnTop(false);
        await win.setResizable(true);
        await win.setSize(new LogicalSize(DEFAULT_MAIN_WINDOW_WIDTH, DEFAULT_MAIN_WINDOW_HEIGHT));

        if (primary) {
          await win.setPosition(new PhysicalPosition(defaultState.x, defaultState.y));
        } else {
          await win.center();
        }

        writeStoredValue(storageKeys.mainWindowState, JSON.stringify(defaultState));
      } catch {
        // Ignore window restore errors and keep startup usable.
      }
    })();

    let saveTimer: ReturnType<typeof setTimeout>;
    const saveState = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        void (async () => {
          try {
            const win = getCurrentWindow();
            const [pos, size] = await Promise.all([win.outerPosition(), win.outerSize()]);

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

            if (size.width < MIN_VALID_MAIN_WINDOW_WIDTH || size.height < MIN_VALID_MAIN_WINDOW_HEIGHT) {
              return;
            }

            writeStoredValue(
              storageKeys.mainWindowState,
              JSON.stringify({ x: pos.x, y: pos.y, width: size.width, height: size.height }),
            );
          } catch {
            // Ignore move/resize persistence errors.
          }
        })();
      }, 600);
    };

    let unlistenMove: (() => void) | null = null;
    let unlistenResize: (() => void) | null = null;
    void (async () => {
      try {
        const win = getCurrentWindow();
        unlistenMove = await win.onMoved(saveState);
        unlistenResize = await win.onResized(saveState);
      } catch {
        // Ignore event registration errors.
      }
    })();

    return () => {
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
      const [pos, size, monitors] = await Promise.all([
        win.outerPosition(),
        win.outerSize(),
        availableMonitors(),
      ]);
      savedWindowStateRef.current = { x: pos.x, y: pos.y, width: size.width, height: size.height };
      writeStoredValue(storageKeys.mainWindowState, JSON.stringify(savedWindowStateRef.current));
      const monitorForWindow =
        await monitorFromPoint(pos.x + size.width / 2, pos.y + size.height / 2).catch(() => null);
      const targetMonitors = monitorForWindow ? [monitorForWindow] : monitors;
      const clampedMiniPos = clampToDesktopBounds(pos.x, pos.y, 340, 120, targetMonitors);
      savedMiniPosRef.current = { x: clampedMiniPos.x, y: clampedMiniPos.y };
      setMiniPinned(true);
      await win.setAlwaysOnTop(true);
      await win.setResizable(false);
      await win.setSize(new LogicalSize(340, 120));
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
      if (isValidMainWindowState(saved)) {
        const safeSaved = saved as WindowState;
        const monitors = await availableMonitors().catch(() => []);
        const clamped = clampToDesktopBounds(
          safeSaved.x,
          safeSaved.y,
          safeSaved.width,
          safeSaved.height,
          monitors,
        );
        await win.setSize(new PhysicalSize(safeSaved.width, safeSaved.height));
        await win.setPosition(new PhysicalPosition(clamped.x, clamped.y));
      } else {
        const primary = await primaryMonitor().catch(() => null);
        const defaultState = getCenteredMainWindowState(primary);
        savedWindowStateRef.current = defaultState;
        await win.setSize(new LogicalSize(DEFAULT_MAIN_WINDOW_WIDTH, DEFAULT_MAIN_WINDOW_HEIGHT));
        if (primary) {
          await win.setPosition(new PhysicalPosition(defaultState.x, defaultState.y));
        } else {
          await win.center();
        }
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
