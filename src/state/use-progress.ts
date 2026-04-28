"use client";

// src/state/use-progress.ts
//
// React hook over the progress map persisted at research-desk:v1:progress.
// The hook is deliberately thin: it hydrates from localStorage on mount
// (so SSR renders the empty default and the client upgrades after first
// paint), exposes cycle/set helpers, and writes through to storage on
// every change. Writes go through the `writeEnvelope` helper which already
// handles quota / private-mode errors.

import { useCallback, useEffect, useState } from "react";

import {
  cycleProgress as cycleReducer,
  setProgress as setReducer,
  type ProgressMap,
  type ProgressState,
} from "@/lib/progress";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.progress;

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
      return next;
    });
  }, []);

  const set = useCallback((itemId: string, state: ProgressState) => {
    setProgressState((prev) => {
      const next = setReducer(prev, itemId, state);
      writeEnvelope(KEY, next);
      return next;
    });
  }, []);

  const replace = useCallback((next: ProgressMap) => {
    writeEnvelope(KEY, next);
    setProgressState(next);
  }, []);

  return { progress, hydrated, cycle, set, replace };
}
