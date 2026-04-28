"use client";

// src/state/use-cards.ts
//
// React hook over the SM-2 card-state map persisted at
// research-desk:v1:cards. Hydrates on mount (like use-progress), exposes a
// single `grade` action that runs the SM-2 reducer and writes through, and
// returns a memoised due / upcoming partition the UI can render directly.

import { useCallback, useEffect, useMemo, useState } from "react";

import { FLASHCARDS, type Flashcard } from "@/data/flashcards";
import {
  dueCount,
  grade as gradeReducer,
  initialState,
  partitionDeck,
  type Grade,
  type SM2State,
} from "@/lib/sm2";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.cards;

type CardsMap = Record<string, SM2State>;

export interface UseCardsResult {
  /** SM-2 state map keyed by card id. Empty until hydrated. */
  states: CardsMap;
  /** `true` once the client has loaded persisted state. */
  hydrated: boolean;
  /** Cards due at / before `now`, oldest-due first. */
  due: Flashcard[];
  /** Cards NOT due, ordered by next-due ascending. */
  upcoming: Flashcard[];
  /** Count of cards due at or before `now` (for sidebar badge). */
  todayDue: number;
  /** Apply a grade to one card; persists through `writeEnvelope`. */
  grade: (cardId: string, g: Grade) => void;
  /** Get or initialise a card's SM-2 state (never mutates). */
  getState: (cardId: string) => SM2State;
  /** Wipe all SM-2 state — used by "reset deck" in the details drawer. */
  reset: () => void;
  /** Replace the whole map (used by Import JSON). */
  replace: (next: CardsMap) => void;
}

export function useCards(nowProvider: () => number = Date.now): UseCardsResult {
  const [states, setStates] = useState<CardsMap>({});
  const [hydrated, setHydrated] = useState(false);
  // Re-pin `now` on every grade so the due queue recomputes predictably
  // without re-rendering every second.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const initial = readEnvelope<CardsMap>(KEY, {});
    setStates(initial);
    setHydrated(true);
  }, []);

  const grade = useCallback(
    (cardId: string, g: Grade) => {
      const now = nowProvider();
      setStates((prev) => {
        const existing = prev[cardId] ?? initialState(now);
        const next = gradeReducer(existing, g, now);
        const nextMap: CardsMap = { ...prev, [cardId]: next };
        writeEnvelope(KEY, nextMap);
        return nextMap;
      });
      setTick((t) => t + 1);
    },
    [nowProvider]
  );

  const getState = useCallback(
    (cardId: string): SM2State => {
      return states[cardId] ?? initialState(nowProvider());
    },
    [states, nowProvider]
  );

  const reset = useCallback(() => {
    writeEnvelope(KEY, {});
    setStates({});
    setTick((t) => t + 1);
  }, []);

  const replace = useCallback((next: CardsMap) => {
    writeEnvelope(KEY, next);
    setStates(next);
    setTick((t) => t + 1);
  }, []);

  const { due, upcoming, todayDue } = useMemo(() => {
    const now = nowProvider();
    const { due, upcoming } = partitionDeck(FLASHCARDS, states, now);
    return {
      due,
      upcoming,
      todayDue: dueCount(FLASHCARDS, states, now),
    };
    // `tick` is included so that grades force a recompute even though
    // `states` already changed — defensive against bundler optimisations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states, tick, nowProvider]);

  return {
    states,
    hydrated,
    due,
    upcoming,
    todayDue,
    grade,
    getState,
    reset,
    replace,
  };
}
