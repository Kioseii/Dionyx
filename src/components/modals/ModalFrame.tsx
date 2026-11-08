import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useShell } from "../layout/ShellContext";

type ModalFrameProps = {
  children: ReactNode;
  /** Extra class for the dialog (size/variant). */
  className?: string;
  /** id of the element that names the dialog. */
  labelledBy: string;
  onClose: () => void;
};

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog frame: backdrop, close button, Escape to close, focus moved
 * into the dialog on open and back to where it was on close. Clicking the
 * backdrop closes it, but not when a drag that started inside (e.g. selecting
 * text in a field) ends outside.
 */
export function ModalFrame({ children, className = "", labelledBy, onClose }: ModalFrameProps) {
  const { copy } = useShell();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const pointerDownOnBackdropRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    // Prefer the first field; fall back to the first control after the close button.
    const fields = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [];
    const firstField = [...fields].find((element) => element.tagName === "INPUT" || element.tagName === "TEXTAREA");
    (firstField ?? [...fields].find((element) => !element.classList.contains("modal-x")) ?? dialog)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.stopPropagation();
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onPointerDown={(event) => {
        pointerDownOnBackdropRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pointerDownOnBackdropRef.current && event.target === event.currentTarget) {
          onClose();
        }
        pointerDownOnBackdropRef.current = false;
      }}
    >
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`modal-shell ${className}`.trim()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button aria-label={copy.close} className="modal-x" onClick={onClose} title={copy.close} type="button">
          <X aria-hidden="true" size={16} strokeWidth={2.2} />
        </button>
        {children}
      </div>
    </div>
  );
}
