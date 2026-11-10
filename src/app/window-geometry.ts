/** Monitor rectangle in physical pixels, as returned by Tauri. */
export type MonitorRect = {
  position: { x: number; y: number };
  size: { width: number; height: number };
  scaleFactor?: number;
};

export type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function centerOf(rect: WindowRect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function containsPoint(monitor: MonitorRect, point: { x: number; y: number }) {
  return (
    point.x >= monitor.position.x &&
    point.x < monitor.position.x + monitor.size.width &&
    point.y >= monitor.position.y &&
    point.y < monitor.position.y + monitor.size.height
  );
}

function distanceToMonitor(monitor: MonitorRect, point: { x: number; y: number }) {
  const clampedX = Math.min(Math.max(point.x, monitor.position.x), monitor.position.x + monitor.size.width);
  const clampedY = Math.min(Math.max(point.y, monitor.position.y), monitor.position.y + monitor.size.height);
  return Math.hypot(point.x - clampedX, point.y - clampedY);
}

/**
 * The monitor that holds the centre of `rect`, or the nearest one when the
 * centre falls in a gap between monitors or off every screen.
 */
export function findMonitorForRect(rect: WindowRect, monitors: MonitorRect[]): MonitorRect | null {
  if (monitors.length === 0) {
    return null;
  }

  const center = centerOf(rect);
  const containing = monitors.find((monitor) => containsPoint(monitor, center));

  if (containing) {
    return containing;
  }

  return monitors.reduce((best, monitor) =>
    distanceToMonitor(monitor, center) < distanceToMonitor(best, center) ? monitor : best,
  );
}

/** Moves `rect` so it lies fully inside `monitor` (top-left wins if it is bigger). */
export function clampRectToMonitor(rect: WindowRect, monitor: MonitorRect) {
  const maxX = monitor.position.x + monitor.size.width - rect.width;
  const maxY = monitor.position.y + monitor.size.height - rect.height;

  return {
    x: Math.round(Math.max(monitor.position.x, Math.min(rect.x, maxX))),
    y: Math.round(Math.max(monitor.position.y, Math.min(rect.y, maxY))),
  };
}

/**
 * Clamps a window to the single monitor it belongs to. Unlike clamping to the
 * bounding box of all monitors, this never leaves it in a gap between screens
 * of different sizes, and it can still be dragged from one screen to another.
 */
export function clampRectToMonitors(rect: WindowRect, monitors: MonitorRect[]) {
  const monitor = findMonitorForRect(rect, monitors);
  return monitor ? clampRectToMonitor(rect, monitor) : { x: Math.round(rect.x), y: Math.round(rect.y) };
}

/**
 * Makes a saved window rectangle usable on the current monitor layout: picks
 * its monitor (or the nearest), shrinks it to fit, keeps it above the minimum
 * size and moves it fully on screen. Returns null when there is no monitor.
 */
export function fitRectToMonitors(
  rect: WindowRect,
  monitors: MonitorRect[],
  minWidth: number,
  minHeight: number,
): WindowRect | null {
  const monitor = findMonitorForRect(rect, monitors);

  if (!monitor) {
    return null;
  }

  const width = Math.round(Math.min(Math.max(rect.width, minWidth), monitor.size.width));
  const height = Math.round(Math.min(Math.max(rect.height, minHeight), monitor.size.height));
  const position = clampRectToMonitor({ ...rect, width, height }, monitor);

  return { ...position, width, height };
}

/** A default-size window centred on `monitor`, shrunk to 92% of it if needed. */
export function centeredRectOnMonitor(
  monitor: MonitorRect,
  logicalWidth: number,
  logicalHeight: number,
): WindowRect {
  const scale = monitor.scaleFactor ?? 1;
  const width = Math.round(Math.min(logicalWidth * scale, monitor.size.width * 0.92));
  const height = Math.round(Math.min(logicalHeight * scale, monitor.size.height * 0.92));

  return {
    x: Math.round(monitor.position.x + (monitor.size.width - width) / 2),
    y: Math.round(monitor.position.y + (monitor.size.height - height) / 2),
    width,
    height,
  };
}
