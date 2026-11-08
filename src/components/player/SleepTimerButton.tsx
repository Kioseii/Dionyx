import { useEffect, useRef, useState } from "react";
import { Moon } from "lucide-react";
import { useShell } from "../layout/ShellContext";

const MINUTE_OPTIONS = [15, 30, 45, 60, 90];

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes >= 1 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `0:${String(seconds).padStart(2, "0")}`;
}

/** Player bar button + menu for the sleep timer. */
export function SleepTimerButton() {
  const { copy, sleepTimer } = useShell();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { timer } = sleepTimer;
  const isActive = timer.kind !== "off";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const badge =
    timer.kind === "minutes" ? formatRemaining(sleepTimer.remainingMs) : timer.kind === "end-of-track" ? copy.sleepTimerEndShort : null;
  const label = isActive
    ? `${copy.sleepTimer}: ${timer.kind === "minutes" ? formatRemaining(sleepTimer.remainingMs) : copy.sleepTimerEndOfTrack}`
    : copy.sleepTimer;

  const choose = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="sleep-timer" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={`player-tool-button sleep-timer-button${isActive ? " active" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title={label}
        type="button"
      >
        <Moon aria-hidden="true" size={17} strokeWidth={2} />
        {badge ? <span className="sleep-timer-badge">{badge}</span> : null}
      </button>

      {open ? (
        <div aria-label={copy.sleepTimer} className="sleep-timer-menu" role="menu">
          <p className="sleep-timer-menu-title">{copy.sleepTimer}</p>
          {MINUTE_OPTIONS.map((minutes) => (
            <button
              className={`sleep-timer-option${timer.kind === "minutes" && timer.minutes === minutes ? " selected" : ""}`}
              key={minutes}
              onClick={() => choose(() => sleepTimer.startMinutes(minutes))}
              role="menuitem"
              type="button"
            >
              {minutes} {copy.sleepTimerMinutes}
            </button>
          ))}
          <button
            className={`sleep-timer-option${timer.kind === "end-of-track" ? " selected" : ""}`}
            onClick={() => choose(sleepTimer.startEndOfTrack)}
            role="menuitem"
            type="button"
          >
            {copy.sleepTimerEndOfTrack}
          </button>
          {isActive ? (
            <button className="sleep-timer-option cancel" onClick={() => choose(sleepTimer.cancel)} role="menuitem" type="button">
              {copy.sleepTimerOff}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
