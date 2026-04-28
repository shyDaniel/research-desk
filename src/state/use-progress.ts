"use client";

// src/state/use-progress.ts
//
// React hook over the progress map persisted at research-desk:v1:progress.
// The hook is deliberately thin: it hydrates from localStorage on mount
// (so SSR renders the empty default and the client upgrades after first
// paint), exposes cycle/set helpers, and writes through to storage on
// every change. Writes go through the `writeEnvelope` helper which already
// handles quota / private-mode errors.
//
// Side-effect: every cycle also updates the weekly-streak envelope
// (research-desk:v1:streak) via src/lib/streak. Landing on `done` adds
// today to the streak's qualifying-day set; every cycle refreshes the
// `lastTouched` pointer that the Dashboard's Continue card reads.

import { useCallback, useEffect, useState } from "react";

import {
  cycleProgress as cycleReducer,
  nextState as nextProgressState,
  setProgress as setReducer,
  type ProgressMap,
  type ProgressState,
} from "@/lib/progress";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";
import {
  EMPTY_STREAK,
  recordProgressDone,
  recordProgressTouch,
  type StreakState,
} from "@/lib/streak";

const KEY = STORAGE_KEYS.progress;
const STREAK_KEY = STORAGE_KEYS.streak;
const STREAK_EVENT = "research-desk:streak-change";

/**
 * Update the streak envelope in response to a progress change.
 * Kept outside React state so the side-effect fires exactly once per user
 * gesture regardless of how many times `setState` is called.
 */
function recordStreak(itemId: string, state: ProgressState) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const prev = readEnvelope<StreakState>(STREAK_KEY, EMPTY_STREAK);
  const next =
    state === "done"
      ? recordProgressDone(prev, now, itemId)
      : recordProgressTouch(prev, now, itemId);
  writeEnvelope(STREAK_KEY, next);
  try {
    window.dispatchEvent(new Event(STREAK_EVENT));
  } catch {
    // ignore
  }
}

interface UseProgressResult {
  /** Map of itemId → state. Items not in the map are pending. */
  progress: ProgressMap;
  /** `true` until first client-side hydration completes. */
  hydrated: boolean;
  /** Advance a single item one step along pending → inprog → done → pending. */
  cycle: (itemId: string) => void;
  /** Set an explicit state (used by Import JSON or future bulk ops). */
  set: (itemId: string, state: ProgressState) => void;
  /** Overwrite the whole map. Used by Import JSON. */
  replace: (next: ProgressMap) => void;
}

export function useProgress(): UseProgressResult {
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once, after mount — server render stays deterministic.
  useEffect(() => {
    const initial = readEnvelope<ProgressMap>(KEY, {});
    setProgressState(initial);
    setHydrated(true);
  }, []);

  const cycle = useCallback((itemId: string) => {
    setProgressState((prev) => {
      const next = cycleReducer(prev, itemId);
      writeEnvelope(KEY, next);
      // `cycleReducer` deletes the entry when it wraps to pending, so read
      // the post-cycle state by re-computing from the source of truth.
      const current = prev[itemId] ?? "pending";
      const landed = nextProgressState(current);
      recordStreak(itemId, landed);
      return next;
    });
  }, []);

  const set = useCallback((itemId: string, state: ProgressState) => {
    setProgressState((prev) => {
      const next = setReducer(prev, itemId, state);
      writeEnvelope(KEY, next);
      recordStreak(itemId, state);
      return next;
    });
  }, []);

  const replace = useCallback((next: ProgressMap) => {
    writeEnvelope(KEY, next);
    setProgressState(next);
  }, []);

  return { progress, hydrated, cycle, set, replace };
}
