"use client";

// src/state/use-streak.ts
//
// React hook over the streak state persisted at research-desk:v1:streak.
// Mirrors the shape of use-progress / use-cards: hydrate once after mount,
// write-through on every reducer invocation.
//
// Two side-effect primitives are exposed for other hooks to call:
//   - `progressCycled(itemId, { done })` — always updates `lastTouched`;
//     also adds today to the streak when `done === true`.
//   - `cardReviewed()` — increments the rolling card counter and adds today
//     to the streak once the threshold is crossed.
//
// Reads in other components (e.g. the Dashboard) go through this hook so
// there is a single source of truth for the streak UI.

import { useCallback, useEffect, useState } from "react";

import {
  EMPTY_STREAK,
  last7,
  recordCardReview as cardReduce,
  recordProgressDone as doneReduce,
  recordProgressTouch as touchReduce,
  streakCount,
  currentRun,
  type StreakState,
} from "@/lib/streak";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.streak;

/**
 * Custom event dispatched whenever one hook mutates the streak so the
 * dashboard hook re-hydrates live (the `storage` event only fires across
 * tabs, not within the same document).
 */
const STREAK_EVENT = "research-desk:streak-change";

function broadcast() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STREAK_EVENT));
  }
}

export interface UseStreakResult {
  state: StreakState;
  hydrated: boolean;
  /** The last 7 days, oldest-first. Element 6 is today. */
  last7: Array<{ date: string; active: boolean }>;
  /** Number of qualifying days in the last 7. */
  count: number;
  /** Length of the current consecutive-day run ending today. */
  run: number;
  /** Record one curriculum item cycle; only marks the day when `done`. */
  progressCycled: (itemId: string, opts: { done: boolean }) => void;
  /** Record a single card review. */
  cardReviewed: () => void;
  /** Wipe the whole streak. Used by the reset-all dev affordance. */
  reset: () => void;
  /** Overwrite the whole state. Used by Import JSON. */
  replace: (next: StreakState) => void;
}

export function useStreak(
  nowProvider: () => number = Date.now
): UseStreakResult {
  const [state, setState] = useState<StreakState>(EMPTY_STREAK);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate on mount.
  useEffect(() => {
    const initial = readEnvelope<StreakState>(KEY, EMPTY_STREAK);
    setState(initial);
    setHydrated(true);
  }, []);

  // Re-hydrate whenever another hook (or another tab) writes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reload = () => {
      setState(readEnvelope<StreakState>(KEY, EMPTY_STREAK));
    };
    window.addEventListener(STREAK_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(STREAK_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const progressCycled = useCallback(
    (itemId: string, { done }: { done: boolean }) => {
      const now = nowProvider();
      setState((prev) => {
        const next = done
          ? doneReduce(prev, now, itemId)
          : touchReduce(prev, now, itemId);
        writeEnvelope(KEY, next);
        broadcast();
        return next;
      });
    },
    [nowProvider]
  );

  const cardReviewed = useCallback(() => {
    const now = nowProvider();
    setState((prev) => {
      const next = cardReduce(prev, now);
      writeEnvelope(KEY, next);
      broadcast();
      return next;
    });
  }, [nowProvider]);

  const reset = useCallback(() => {
    writeEnvelope(KEY, EMPTY_STREAK);
    setState(EMPTY_STREAK);
    broadcast();
  }, []);

  const replace = useCallback((next: StreakState) => {
    writeEnvelope(KEY, next);
    setState(next);
    broadcast();
  }, []);

  const now = nowProvider();
  return {
    state,
    hydrated,
    last7: last7(state, now),
    count: streakCount(state, now),
    run: currentRun(state, now),
    progressCycled,
    cardReviewed,
    reset,
    replace,
  };
}
