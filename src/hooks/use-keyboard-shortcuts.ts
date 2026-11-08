import { useEffect, useRef } from "react";
import {
  isRepeatableShortcut,
  isShortcutBlockedTarget,
  resolveShortcut,
  type ShortcutAction,
} from "../app/shortcuts";

type ShortcutHandlers = Record<ShortcutAction, () => void>;

/**
 * App-wide keyboard shortcuts (see app/shortcuts.ts for the key map). Keys
 * typed into fields, sliders or dialogs, and keys a component already handled
 * (e.g. Space/Enter on a library row), are left alone.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || isShortcutBlockedTarget(event.target)) {
        return;
      }

      const action = resolveShortcut(event);

      if (!action || (event.repeat && !isRepeatableShortcut(action))) {
        return;
      }

      // Also stops Space from clicking a focused button and the arrows from scrolling.
      event.preventDefault();
      handlersRef.current[action]();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
