import { buildShuffledQueueFromIndices } from "./utils";

/** What the queue was last built against. Kept by the caller between runs. */
export type QueueBuildState = {
  /** Playback playlist id, or "library". */
  sourceId: string;
  sourceLength: number;
  shuffle: boolean;
  sortKey: string;
  /** Order before shuffling, so turning shuffle off restores it. */
  linearBase: number[];
};

export type QueuePlanInput = {
  previous: QueueBuildState | null;
  sourceId: string;
  sourceLength: number;
  shuffle: boolean;
  sortKey: string;
  currentIndex: number;
  queue: number[];
  queuePosition: number;
  /**
   * Indices of the rows currently on screen, or null when the visible list is
   * NOT the list that is playing (e.g. browsing a playlist while the library
   * plays). The visible list only ever shapes the queue of its own source.
   */
  viewIndices: number[] | null;
  /** Injectable for tests. */
  shuffleIndices?: (indices: number[], startPosition: number) => number[];
};

export type QueuePlan =
  | { kind: "none" }
  | { kind: "position"; position: number }
  | { kind: "rebuild"; queue: number[]; position: number; state: QueueBuildState };

function isValidIndexList(indices: number[], length: number) {
  return indices.length > 0 && indices.every((index) => index >= 0 && index < length);
}

/**
 * Decides whether the playback queue must be rebuilt and how.
 *
 * The queue is rebuilt only when something that defines it changes: the
 * playback source (or its length), shuffle, the sort of the visible source, or
 * the current track falling outside the queue. Browsing other views, typing in
 * the search box or reordering nothing never reshapes a running queue.
 */
export function planQueueUpdate(input: QueuePlanInput): QueuePlan {
  const {
    previous,
    sourceId,
    sourceLength,
    shuffle,
    sortKey,
    queue,
    queuePosition,
    viewIndices,
  } = input;
  const shuffleIndices = input.shuffleIndices ?? buildShuffledQueueFromIndices;

  if (sourceLength === 0) {
    return queue.length > 0 || queuePosition !== 0
      ? {
          kind: "rebuild",
          queue: [],
          position: 0,
          state: { sourceId, sourceLength, shuffle, sortKey, linearBase: [] },
        }
      : { kind: "none" };
  }

  const currentIndex = Math.min(Math.max(input.currentIndex, 0), sourceLength - 1);
  const queueIsValid = isValidIndexList(queue, sourceLength);
  const currentPosition = queueIsValid ? queue.indexOf(currentIndex) : -1;
  const sourceChanged =
    !previous || previous.sourceId !== sourceId || previous.sourceLength !== sourceLength;
  const shuffleChanged = Boolean(previous) && previous!.shuffle !== shuffle;
  const sortChanged = Boolean(previous) && previous!.sortKey !== sortKey && viewIndices !== null;
  const needsRebuild =
    !queueIsValid || sourceChanged || shuffleChanged || sortChanged || currentPosition < 0;

  if (!needsRebuild) {
    return queuePosition !== currentPosition
      ? { kind: "position", position: currentPosition }
      : { kind: "none" };
  }

  const visible = viewIndices?.filter((index) => index >= 0 && index < sourceLength) ?? [];
  const previousBase =
    previous && !sourceChanged && isValidIndexList(previous.linearBase, sourceLength)
      ? previous.linearBase
      : [];
  const naturalOrder = Array.from({ length: sourceLength }, (_, index) => index);

  let linearBase: number[];
  if (visible.includes(currentIndex)) {
    linearBase = visible;
  } else if (previousBase.includes(currentIndex)) {
    linearBase = previousBase;
  } else {
    linearBase = naturalOrder;
  }

  const startPosition = Math.max(linearBase.indexOf(currentIndex), 0);
  const nextQueue = shuffle ? shuffleIndices(linearBase, startPosition) : [...linearBase];

  return {
    kind: "rebuild",
    queue: nextQueue,
    position: Math.max(nextQueue.indexOf(currentIndex), 0),
    state: { sourceId, sourceLength, shuffle, sortKey, linearBase: [...linearBase] },
  };
}
