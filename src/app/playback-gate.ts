/**
 * Gapless hand-off: while the end of the previous song plays on the "tail"
 * element, the main element already has the next song loaded but must not
 * start until that end is reached. The autoplay path waits on this gate.
 * There is a single player, so a module-level gate is enough.
 */
type Gate = { promise: Promise<boolean>; release: (shouldPlay: boolean) => void };

let currentGate: Gate | null = null;

/** Holds the next autoplay. Call the returned function to let it start (true) or cancel it (false). */
export function holdNextPlayback() {
  let resolvePromise: (value: boolean) => void = () => {};
  const promise = new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
  });
  const gate: Gate = {
    promise,
    release: (shouldPlay) => {
      if (currentGate === gate) {
        currentGate = null;
      }
      resolvePromise(shouldPlay);
    },
  };

  currentGate?.release(true);
  currentGate = gate;
  return gate.release;
}

/** Resolves true right away when nothing is held. */
export function waitForPlaybackGate(): Promise<boolean> {
  return currentGate ? currentGate.promise : Promise.resolve(true);
}

export function isPlaybackHeld() {
  return currentGate !== null;
}
