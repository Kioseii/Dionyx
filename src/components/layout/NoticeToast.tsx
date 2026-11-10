import { Info, X } from "lucide-react";
import { useShell } from "./ShellContext";

/**
 * Transient status notice (replaces the fixed "library status" banner). It
 * shows `statusMessage` while `isNoticeVisible` is true; the existing 10 s
 * timer in useLibraryScan hides it, and it can be dismissed.
 */
export function NoticeToast() {
  const { copy, isNoticeVisible, onDismissNotice, statusMessage } = useShell();

  return (
    <div aria-live="polite" className="notice-toast-region" role="status">
      {isNoticeVisible && statusMessage ? (
        <div className="notice-toast">
          <Info aria-hidden="true" className="notice-toast-icon" size={18} strokeWidth={2.1} />
          <span className="notice-toast-text">{statusMessage}</span>
          <button
            aria-label={copy.dismissNotice}
            className="notice-toast-close"
            onClick={onDismissNotice}
            type="button"
          >
            <X aria-hidden="true" size={14} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
