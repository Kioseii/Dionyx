import { useEffect, useRef, useState } from "react";

export type SleepTimerState =
  | { kind: "off" }
  | { kind: "minutes"; endsAt: number; minutes: number }
  | { kind: "end-of-track" };

/**
 * Sleep timer: after N minutes calls `onSleep` (which fades out and pauses),
 * or with "end of track" lets the current song finish and then stops instead
 * of moving on (see `consumeEndOfTrack`).
 */
export function useSleepTimer(onSleep: () => void) {
  const [timer, setTimer] = useState<SleepTimerState>({ kind: "off" });
  const [now, setNow] = useState(() => Date.now());
  const onSleepRef = useRef(onSleep);
  onSleepRef.current = onSleep;
  const timerRef = useRef(timer);
  timerRef.current = timer;

  useEffect(() => {
    if (timer.kind !== "minutes") {
      return;
    }

    function tick() {
      const current = Date.now();
      setNow(current);

      if (timer.kind === "minutes" && current >= timer.endsAt) {
        setTimer({ kind: "off" });
        onSleepRef.current();
      }
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  return {
    cancel: () => setTimer({ kind: "off" }),
    /** True (and clears the timer) when the track that just ended should be the last. */
    consumeEndOfTrack: () => {
      if (timerRef.current.kind !== "end-of-track") {
        return false;
      }

      setTimer({ kind: "off" });
      return true;
    },
    remainingMs: timer.kind === "minutes" ? Math.max(0, timer.endsAt - now) : 0,
    startEndOfTrack: () => setTimer({ kind: "end-of-track" }),
    startMinutes: (minutes: number) => {
      const startedAt = Date.now();
      setNow(startedAt);
      setTimer({ kind: "minutes", endsAt: startedAt + minutes * 60_000, minutes });
    },
    timer,
  };
}
