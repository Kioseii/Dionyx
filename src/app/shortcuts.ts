export type ShortcutAction =
  | "toggle-playback"
  | "seek-back"
  | "seek-forward"
  | "previous-track"
  | "next-track"
  | "volume-up"
  | "volume-down"
  | "toggle-mute"
  | "focus-search"
  | "toggle-lyrics"
  | "toggle-queue"
  | "toggle-now-playing"
  | "toggle-shuffle"
  | "cycle-repeat";

type KeyInput = {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

/** Seconds moved by the arrow keys, and volume step for Ctrl+Up/Down. */
export const SHORTCUT_SEEK_SECONDS = 5;
export const SHORTCUT_VOLUME_STEP = 0.05;

/**
 * Maps a key press to a player action, or null when it is not a shortcut.
 * Ctrl and Cmd are treated alike so the same keys work on macOS.
 */
export function resolveShortcut({ altKey, ctrlKey, key, metaKey, shiftKey }: KeyInput): ShortcutAction | null {
  if (altKey) {
    return null;
  }

  const mod = ctrlKey || metaKey;
  const lower = key.length === 1 ? key.toLowerCase() : key;

  if (mod) {
    if (shiftKey) return null;
    switch (lower) {
      case "ArrowLeft":
        return "previous-track";
      case "ArrowRight":
        return "next-track";
      case "ArrowUp":
        return "volume-up";
      case "ArrowDown":
        return "volume-down";
      case "f":
        return "focus-search";
      default:
        return null;
    }
  }

  switch (lower) {
    case " ":
      return shiftKey ? null : "toggle-playback";
    case "ArrowLeft":
      return shiftKey ? null : "seek-back";
    case "ArrowRight":
      return shiftKey ? null : "seek-forward";
    case "/":
      return "focus-search";
    case "m":
      return "toggle-mute";
    case "l":
      return "toggle-lyrics";
    case "q":
      return "toggle-queue";
    case "f":
      return "toggle-now-playing";
    case "s":
      return "toggle-shuffle";
    case "r":
      return "cycle-repeat";
    default:
      return null;
  }
}

/** Actions that should not fire again while the key is held down. */
export function isRepeatableShortcut(action: ShortcutAction) {
  return (
    action === "seek-back" ||
    action === "seek-forward" ||
    action === "volume-up" ||
    action === "volume-down"
  );
}

/**
 * Whether a key press should be left alone because the user is typing or
 * working a control that uses the keys itself (sliders, selects, dialogs).
 */
export function isShortcutBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) {
    return true;
  }

  // Dialogs (equalizer, playlists, metadata) keep their own keys.
  return target.closest(".modal-backdrop") !== null;
}
