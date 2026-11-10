import { availableMonitors, getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import type { MouseEvent as ReactMouseEvent } from "react";
import { clampRectToMonitors } from "../app/window-geometry";

export function useMiniPlayerDrag() {
  function handleMiniPlayerMouseDown(e: ReactMouseEvent<HTMLElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".mp-interactive")) return;
    e.preventDefault();

    void (async () => {
      try {
        const win = getCurrentWindow();
        const [initialPos, winSize, monitors] = await Promise.all([
          win.outerPosition(),
          win.outerSize(),
          availableMonitors(),
        ]);
        const dpr = window.devicePixelRatio || 1;
        const startMouseX = e.screenX;
        const startMouseY = e.screenY;
        let pendingX = initialPos.x;
        let pendingY = initialPos.y;
        let rafId: number | null = null;

        const onMouseMove = (me: MouseEvent) => {
          let newX = initialPos.x + (me.screenX - startMouseX) * dpr;
          let newY = initialPos.y + (me.screenY - startMouseY) * dpr;
          // Clamp to the monitor under the window (not the bounding box of
          // all monitors, which allows positions in gaps between screens).
          const clamped = clampRectToMonitors(
            { x: newX, y: newY, width: winSize.width, height: winSize.height },
            monitors,
          );
          newX = clamped.x;
          newY = clamped.y;
          pendingX = newX;
          pendingY = newY;
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              rafId = null;
              void win.setPosition(new PhysicalPosition(pendingX, pendingY));
            });
          }
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      } catch {
        void getCurrentWindow().startDragging();
      }
    })();
  }

  return {
    handleMiniPlayerMouseDown,
  };
}
