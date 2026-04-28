// src/lib/streak.ts
//
// Pure logic for the weekly-streak indicator per FINAL_GOAL.md §3.1:
// "Weekly streak indicator (days with ≥ 1 item marked done or ≥ 5 cards
// reviewed)."
//
// The persisted state is intentionally tiny:
//
//   interface StreakState {
//     days: string[];                               // ISO dates qualified
//     cardsToday: { date: string; count: number };  // rolling today-count
//     lastTouched?: { id: string; at: number };     // last curriculum cycle
//   }
//
// - `days` accumulates ISO `YYYY-MM-DD` strings exactly once each, for every
//   date on which at least one qualifying activity happened. The Dashboard's
//   7-dot row reads the last seven days out of this set.
//
// - `cardsToday` is a rolling count so we can detect the ≥5-review threshold
//   without persisting every single grade. When the date rolls over we
//   reset the counter.
//
// - `lastTouched` is the most-recent curriculum item the user cycled (moved
//   into inprog or done). The Dashboard's "Continue" card deep-links at it.
//   We keep only the latest entry; old values are overwritten.
//
// Everything here is pure: no React, no localStorage. The hook in
// src/state/use-streak.ts does I/O.

/** Number of card reviews in a day that qualifies that day for the streak. */
export const DAILY_CARD_THRESHOLD = 5;

/** Shape persisted at research-desk:v1:streak. */
export interface StreakState {
  /** Unique, sorted-ascending list of ISO dates with qualifying activity. */
  days: string[];
  /** Rolling per-day count so we can detect the ≥5-review threshold. */
  cardsToday: { date: string; count: number };
  /** Most-recent curriculum item the user moved into inprog/done. */
  lastTouched?: { id: string; at: number };
}

export const EMPTY_STREAK: StreakState = {
  days: [],
  cardsToday: { date: "", count: 0 },
};

/**
 * Produce the ISO `YYYY-MM-DD` date for a given epoch-ms, in LOCAL time.
 * The streak is a daily-habit UX affordance, so "today" means the user's
 * local calendar day, not UTC.
 */
export function isoDate(at: number): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add today to the streak's qualifying-days list. Idempotent, sorted. */
export function addActivity(state: StreakState, date: string): StreakState {
  if (state.days.includes(date)) return state;
  const days = [...state.days, date].sort();
  return { ...state, days };
}

/**
 * Record that the user marked one curriculum item as `done`. A single
 * qualifying event is enough to light up the whole day.
 */
export function recordProgressDone(
  state: StreakState,
  at: number,
  itemId: string
): StreakState {
  const date = isoDate(at);
  const withDay = addActivity(state, date);
  return { ...withDay, lastTouched: { id: itemId, at } };
}

/**
 * Record that the user *touched* a curriculum item (cycled into inprog or
 * done). Only `lastTouched` is updated; the streak day itself is only
 * triggered by `recordProgressDone`.
 */
export function recordProgressTouch(
  state: StreakState,
  at: number,
  itemId: string
): StreakState {
  return { ...state, lastTouched: { id: itemId, at } };
}

/**
 * Record one card review. When the per-day count crosses the threshold the
 * day is added to `days` (once). When the date rolls over the counter resets.
 */
export function recordCardReview(state: StreakState, at: number): StreakState {
  const date = isoDate(at);
  const isSameDay = state.cardsToday.date === date;
  const nextCount = (isSameDay ? state.cardsToday.count : 0) + 1;
  const cardsToday = { date, count: nextCount };
  const daysSatisfied = nextCount >= DAILY_CARD_THRESHOLD;
  const next: StreakState = { ...state, cardsToday };
  return daysSatisfied ? addActivity(next, date) : next;
}

/**
 * Return the boolean "active/idle" pattern for the last 7 days, oldest
 * first. Element 6 is today, element 0 is today − 6 days.
 *
 * The consumer also gets the iso label for each slot so the Dashboard can
 * render a tooltip / aria-label per dot.
 */
export function last7(
  state: StreakState,
  todayAt: number
): Array<{ date: string; active: boolean }> {
  const out: Array<{ date: string; active: boolean }> = [];
  const set = new Set(state.days);
  const today = new Date(todayAt);
  // Zero out the time portion so every slot is exactly 24h apart.
  today.setHours(0, 0, 0, 0);
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const iso = isoDate(d.getTime());
    out.push({ date: iso, active: set.has(iso) });
  }
  return out;
}

/** Count of qualifying days in the last 7 (0..7). */
export function streakCount(state: StreakState, todayAt: number): number {
  return last7(state, todayAt).filter((d) => d.active).length;
}

/**
 * Length of the CURRENT run of consecutive active days ending at `todayAt`.
 * 0 if today and yesterday are both inactive; N if today has been active for
 * N days in a row. Capped at 7 because we only render 7 dots.
 */
export function currentRun(state: StreakState, todayAt: number): number {
  const slots = last7(state, todayAt);
  let run = 0;
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i]!.active) run += 1;
    else break;
  }
  return run;
}
