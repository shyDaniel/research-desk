// src/lib/sm2.ts
//
// SM-2 spaced-repetition scheduler. Pure functions over a flat, serialisable
// SM2State record — this module is the logic "kernel" used by the Flashcards
// tab and persisted to `research-desk:v1:cards`.
//
// References:
//   - Original SM-2 formulation: P. Wozniak, "Optimization of repetition
//     spacing in the practice of learning", https://super-memo.com/english/ol/sm2.htm
//   - Anki's modern gloss (Again / Hard / Good / Easy, interval multipliers):
//     https://docs.ankiweb.net/deck-options.html
//
// The public grade values are:
//   "again" — full relapse, reset reps, short re-learn interval.
//   "hard"  — recalled with serious friction; interval grows slowly; EF drops.
//   "good"  — recalled correctly with normal effort; EF unchanged (canonical SM-2 q=4).
//   "easy"  — trivially recalled; interval jumps, EF rises.
//
// The classic SM-2 ease-factor update is:
//     EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
// with q ∈ [0, 5]. We map grades to q as:
//     again=2, hard=3, good=4, easy=5
// That yields ΔEF of  -0.32, -0.14, 0.00, +0.10 respectively, matching
// Anki's behaviour. EF is clamped at MIN_EASE (1.3) per SM-2.

export type Grade = "again" | "hard" | "good" | "easy";

/** Persistent per-card state. Kept flat + JSON-serialisable. */
export interface SM2State {
  /** Ease factor. Canonical SM-2 starts at 2.5 and drifts by grade. */
  ease: number;
  /** Inter-review interval in days. 0 while in learning queue. */
  interval: number;
  /** Number of consecutive correct (>= "hard") reviews. */
  reps: number;
  /** Lapse count — how many times "again" has been pressed overall. */
  lapses: number;
  /** Unix-ms timestamp of the next review. */
  due: number;
  /** Unix-ms timestamp of the most recent review, or null if never reviewed. */
  lastReviewed: number | null;
}

/** The minimum ease SM-2 allows. Below this, cards become punishingly frequent. */
export const MIN_EASE = 1.3;
/** The starting ease for a freshly introduced card. */
export const DEFAULT_EASE = 2.5;
/** Milliseconds in a day — used for interval arithmetic. */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Build the initial state for a never-seen card. `now` lets tests be deterministic. */
export function initialState(now: number = Date.now()): SM2State {
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    // A new card is due immediately.
    due: now,
    lastReviewed: null,
  };
}

/**
 * Apply one grade to a card and return the next state. Pure — `now` and
 * the input `state` are the only inputs; nothing is mutated.
 *
 * Interval rules:
 *   - again: reset reps → 0, short relearn interval (10 minutes), increment lapses.
 *   - hard:  if first successful review, 1 day; otherwise interval * 1.2.
 *   - good:  if reps == 0 → 1 day; reps == 1 → 6 days; else interval * ease.
 *   - easy:  if reps == 0 → 4 days; reps == 1 → 7 days; else interval * ease * 1.3.
 *
 * Ease delta follows the SM-2 quadratic above.
 */
export function grade(state: SM2State, g: Grade, now: number = Date.now()): SM2State {
  const q = gradeToQ(g);
  const easeNext = clampEase(state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (g === "again") {
    const relearnMs = 10 * 60 * 1000; // 10 minutes
    return {
      ease: easeNext,
      interval: 0,
      reps: 0,
      lapses: state.lapses + 1,
      due: now + relearnMs,
      lastReviewed: now,
    };
  }

  const nextReps = state.reps + 1;
  const intervalDays = nextIntervalDays(state, g, easeNext);
  return {
    ease: easeNext,
    interval: intervalDays,
    reps: nextReps,
    lapses: state.lapses,
    due: now + Math.round(intervalDays * MS_PER_DAY),
    lastReviewed: now,
  };
}

/** Convert the four user-facing grades to SM-2's integer 0..5 quality score. */
function gradeToQ(g: Grade): number {
  switch (g) {
    case "again":
      return 2;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

function clampEase(e: number): number {
  if (Number.isNaN(e) || !Number.isFinite(e)) return MIN_EASE;
  return e < MIN_EASE ? MIN_EASE : e;
}

/** Pure interval computation for non-"again" grades. Exported for tests. */
export function nextIntervalDays(
  state: SM2State,
  g: Exclude<Grade, "again">,
  easeNext: number
): number {
  const reps = state.reps;
  if (g === "hard") {
    if (reps === 0) return 1;
    return round1(state.interval * 1.2);
  }
  if (g === "good") {
    if (reps === 0) return 1;
    if (reps === 1) return 6;
    return round1(state.interval * easeNext);
  }
  // easy
  if (reps === 0) return 4;
  if (reps === 1) return 7;
  return round1(state.interval * easeNext * 1.3);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** True if the card's next due time is at or before `now`. */
export function isDue(state: SM2State, now: number = Date.now()): boolean {
  return state.due <= now;
}

/**
 * Split a deck into `{ due, upcoming }` partitions in the order they should
 * be reviewed. Due cards come first, oldest-due first; upcoming cards are
 * ordered by their due date ascending so "study ahead" feels natural.
 *
 * `deck` is an array of `[cardId, state]` pairs; callers build this by
 * merging authored card ids with their SM2State map.
 */
export function partitionDeck<T extends { id: string }>(
  deck: ReadonlyArray<T>,
  states: Readonly<Record<string, SM2State>>,
  now: number = Date.now()
): { due: T[]; upcoming: T[] } {
  const due: Array<{ card: T; at: number }> = [];
  const upcoming: Array<{ card: T; at: number }> = [];
  for (const card of deck) {
    const st = states[card.id] ?? initialState(now);
    if (st.due <= now) {
      due.push({ card, at: st.due });
    } else {
      upcoming.push({ card, at: st.due });
    }
  }
  due.sort((a, b) => a.at - b.at);
  upcoming.sort((a, b) => a.at - b.at);
  return {
    due: due.map((x) => x.card),
    upcoming: upcoming.map((x) => x.card),
  };
}

/** Count of cards due at or before `now`. O(n) — fine for ≤ 30-ish cards. */
export function dueCount<T extends { id: string }>(
  deck: ReadonlyArray<T>,
  states: Readonly<Record<string, SM2State>>,
  now: number = Date.now()
): number {
  let n = 0;
  for (const card of deck) {
    const st = states[card.id];
    if (!st) {
      // Unseen card — treat as due now.
      n += 1;
      continue;
    }
    if (st.due <= now) n += 1;
  }
  return n;
}
