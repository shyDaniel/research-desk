// src/lib/progress.ts
//
// Pure reducer for curriculum-item progress state. Per FINAL_GOAL.md §3.2,
// a checkbox click cycles the item's state pending → inprog → done → pending.
// The reducer is pure so it is trivially testable and the hook layer
// (src/state/use-progress.ts) can stay thin.

export type ProgressState = "pending" | "inprog" | "done";

/** The default state for any curriculum item that has never been touched. */
export const DEFAULT_PROGRESS: ProgressState = "pending";

/** Shape persisted at `research-desk:v1:progress`. */
export type ProgressMap = Record<string, ProgressState>;

/**
 * Advance one item's state by one position on the cycle. Writing pending
 * items out of the map keeps the persisted payload small.
 */
export function cycleProgress(
  map: ProgressMap,
  itemId: string
): ProgressMap {
  const current = map[itemId] ?? DEFAULT_PROGRESS;
  const next = nextState(current);
  const copy: ProgressMap = { ...map };
  if (next === "pending") {
    delete copy[itemId];
  } else {
    copy[itemId] = next;
  }
  return copy;
}

/** Set an explicit state (not used by the checkbox but useful for tests / import). */
export function setProgress(
  map: ProgressMap,
  itemId: string,
  state: ProgressState
): ProgressMap {
  const copy: ProgressMap = { ...map };
  if (state === "pending") {
    delete copy[itemId];
  } else {
    copy[itemId] = state;
  }
  return copy;
}

/** Look up one item's state, falling back to `pending`. */
export function getProgress(map: ProgressMap, itemId: string): ProgressState {
  return map[itemId] ?? DEFAULT_PROGRESS;
}

/** The three-state cycle in one place. */
export function nextState(s: ProgressState): ProgressState {
  switch (s) {
    case "pending":
      return "inprog";
    case "inprog":
      return "done";
    case "done":
      return "pending";
  }
}

/**
 * Aggregate counts for a set of item ids. Used by the dashboard and the
 * curriculum filter bar. Missing ids count as `pending`.
 */
export function summarize(
  map: ProgressMap,
  ids: ReadonlyArray<string>
): { pending: number; inprog: number; done: number; total: number } {
  let pending = 0;
  let inprog = 0;
  let done = 0;
  for (const id of ids) {
    const state = getProgress(map, id);
    if (state === "done") done += 1;
    else if (state === "inprog") inprog += 1;
    else pending += 1;
  }
  return { pending, inprog, done, total: ids.length };
}
