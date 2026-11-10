import { describe, expect, it } from "vitest";
import { moveQueueItem, planQueueUpdate, type QueueBuildState, type QueuePlanInput } from "./queue";

// Deterministic "shuffle": start track first, the rest reversed.
const fakeShuffle = (indices: number[], start: number) => [
  indices[start],
  ...indices.filter((_, i) => i !== start).reverse(),
];

function state(overrides: Partial<QueueBuildState> = {}): QueueBuildState {
  return {
    sourceId: "library",
    sourceLength: 5,
    shuffle: false,
    sortKey: "title",
    linearBase: [0, 1, 2, 3, 4],
    ...overrides,
  };
}

function input(overrides: Partial<QueuePlanInput> = {}): QueuePlanInput {
  return {
    previous: state(),
    sourceId: "library",
    sourceLength: 5,
    shuffle: false,
    sortKey: "title",
    currentIndex: 2,
    queue: [0, 1, 2, 3, 4],
    queuePosition: 2,
    viewIndices: [0, 1, 2, 3, 4],
    shuffleIndices: fakeShuffle,
    ...overrides,
  };
}

describe("planQueueUpdate", () => {
  it("does nothing when the queue already matches", () => {
    expect(planQueueUpdate(input())).toEqual({ kind: "none" });
  });

  it("only moves the position when the current track moved inside the queue", () => {
    expect(planQueueUpdate(input({ currentIndex: 3 }))).toEqual({ kind: "position", position: 3 });
  });

  it("ignores a different visible list while another source is playing", () => {
    // Library playing; user is browsing a 3-track playlist whose indices
    // (0..2) overlap the current library index. Old code rebuilt the library
    // queue from these playlist indices.
    const plan = planQueueUpdate(input({ currentIndex: 1, queue: [4, 1, 3, 0, 2], queuePosition: 1, viewIndices: null }));
    expect(plan).toEqual({ kind: "none" });
  });

  it("does not reshape the queue when the search filter changes", () => {
    // Search narrows the visible rows of the playing source: queue stays.
    const plan = planQueueUpdate(input({ viewIndices: [2, 4] }));
    expect(plan).toEqual({ kind: "none" });
  });

  it("rebuilds from the visible order when the playback source changes", () => {
    const plan = planQueueUpdate(
      input({
        previous: state({ sourceId: "library" }),
        sourceId: "playlist-a",
        sourceLength: 3,
        currentIndex: 1,
        queue: [0, 1, 2, 3, 4],
        viewIndices: [2, 0, 1],
      }),
    );
    expect(plan).toMatchObject({ kind: "rebuild", queue: [2, 0, 1], position: 2 });
  });

  it("restores the pre-shuffle order when shuffle is turned off", () => {
    const shuffled = planQueueUpdate(
      input({ previous: state({ linearBase: [4, 3, 2, 1, 0] }), shuffle: true, viewIndices: null }),
    );
    expect(shuffled).toMatchObject({ kind: "rebuild", queue: [2, 0, 1, 3, 4] });

    const unshuffled = planQueueUpdate(
      input({
        previous: (shuffled as { state: QueueBuildState }).state,
        shuffle: false,
        queue: [2, 0, 1, 3, 4],
        queuePosition: 0,
        viewIndices: null,
      }),
    );
    expect(unshuffled).toMatchObject({ kind: "rebuild", queue: [4, 3, 2, 1, 0], position: 2 });
  });

  it("re-sorts only when the sort changes on the visible playing source", () => {
    const visibleSource = planQueueUpdate(
      input({ sortKey: "artist", viewIndices: [4, 2, 0, 1, 3] }),
    );
    expect(visibleSource).toMatchObject({ kind: "rebuild", queue: [4, 2, 0, 1, 3], position: 1 });

    const otherView = planQueueUpdate(input({ sortKey: "artist", viewIndices: null }));
    expect(otherView).toEqual({ kind: "none" });
  });

  it("rebuilds when the current track is not in the queue", () => {
    const plan = planQueueUpdate(input({ queue: [0, 1], queuePosition: 0, currentIndex: 4, viewIndices: null }));
    expect(plan).toMatchObject({ kind: "rebuild", queue: [0, 1, 2, 3, 4], position: 4 });
  });

  it("drops out-of-range indices after the source shrinks", () => {
    const plan = planQueueUpdate(
      input({ sourceLength: 3, currentIndex: 1, queue: [0, 1, 2, 3, 4], viewIndices: [0, 1, 2, 3, 4] }),
    );
    expect(plan).toMatchObject({ kind: "rebuild", queue: [0, 1, 2], position: 1 });
  });

  it("clears the queue when the source is empty", () => {
    expect(planQueueUpdate(input({ sourceLength: 0 }))).toMatchObject({ kind: "rebuild", queue: [], position: 0 });
    expect(planQueueUpdate(input({ sourceLength: 0, queue: [], queuePosition: 0 }))).toEqual({ kind: "none" });
  });
});

describe("moveQueueItem", () => {
  const queue = [10, 11, 12, 13, 14];

  it("moves a song within Up next", () => {
    expect(moveQueueItem(queue, 1, 4, 2)).toEqual([10, 11, 14, 12, 13]);
    expect(moveQueueItem(queue, 1, 2, 4)).toEqual([10, 11, 13, 14, 12]);
  });

  it("never touches the current or already played songs", () => {
    expect(moveQueueItem(queue, 1, 1, 3)).toBe(queue);
    expect(moveQueueItem(queue, 1, 3, 0)).toBe(queue);
    expect(moveQueueItem(queue, 1, 3, 9)).toBe(queue);
  });
});
