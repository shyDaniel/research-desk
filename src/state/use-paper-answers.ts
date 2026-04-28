"use client";

// src/state/use-paper-answers.ts
//
// Per-paper, per-question free-text answers persisted at
// research-desk:v1:paper-answers as Record<paperSlug, Record<qId, string>>.
// Used by the /papers/[slug] page. Autosave is 250ms debounced (matches
// use-item-notes) so fast typing doesn't stampede localStorage. The
// "reveal my answer" gate on the UI reads the same value straight through
// — the gate threshold lives at REVEAL_THRESHOLD below so the test and
// the UI cannot drift.

import { useCallback, useEffect, useRef, useState } from "react";

import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.paperAnswers;

/**
 * Minimum number of characters the user must type into a question's answer
 * textarea before the "Reveal my answer" button enables. Pulled out as a
 * constant so the UI component and any future test reference a single
 * source of truth. Matches FINAL_GOAL.md §3.4.
 */
export const REVEAL_THRESHOLD = 40;

export type PaperAnswersMap = Record<string, Record<string, string>>;

export interface UsePaperAnswersResult {
  /** Map of paperSlug → questionId → user-typed answer. */
  answers: PaperAnswersMap;
  /** `true` once the client has loaded persisted state from localStorage. */
  hydrated: boolean;
  /** Read a single answer (empty string if absent). */
  getAnswer: (paperSlug: string, questionId: string) => string;
  /**
   * True iff the typed answer for (paperSlug, questionId) is at least
   * REVEAL_THRESHOLD non-whitespace-trimmed characters long. The reveal
   * gate on the UI binds to this.
   */
  canReveal: (paperSlug: string, questionId: string) => boolean;
  /** Update a single answer; debounced 250ms write-through to storage. */
  setAnswer: (paperSlug: string, questionId: string, value: string) => void;
  /** Replace the whole map (used by Import JSON, tests, reset buttons). */
  replace: (next: PaperAnswersMap) => void;
}

export function usePaperAnswers(): UsePaperAnswersResult {
  const [answers, setAnswers] = useState<PaperAnswersMap>({});
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a live ref of the latest map so the debounced flush doesn't write
  // a stale closure value back to localStorage.
  const latest = useRef<PaperAnswersMap>({});

  useEffect(() => {
    const initial = readEnvelope<PaperAnswersMap>(KEY, {});
    setAnswers(initial);
    latest.current = initial;
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        // Flush on unmount so the last keystroke survives a navigation.
        writeEnvelope(KEY, latest.current);
      }
    };
  }, []);

  const setAnswer = useCallback(
    (paperSlug: string, questionId: string, value: string) => {
      setAnswers((prev) => {
        const prevForPaper = prev[paperSlug] ?? {};
        const nextForPaper: Record<string, string> = { ...prevForPaper };
        if (value.length === 0) {
          delete nextForPaper[questionId];
        } else {
          nextForPaper[questionId] = value;
        }
        const next: PaperAnswersMap = { ...prev };
        if (Object.keys(nextForPaper).length === 0) {
          delete next[paperSlug];
        } else {
          next[paperSlug] = nextForPaper;
        }
        latest.current = next;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          writeEnvelope(KEY, next);
          timer.current = null;
        }, 250);
        return next;
      });
    },
    [],
  );

  const getAnswer = useCallback(
    (paperSlug: string, questionId: string): string => {
      return answers[paperSlug]?.[questionId] ?? "";
    },
    [answers],
  );

  const canReveal = useCallback(
    (paperSlug: string, questionId: string): boolean => {
      const v = answers[paperSlug]?.[questionId] ?? "";
      return v.trim().length >= REVEAL_THRESHOLD;
    },
    [answers],
  );

  const replace = useCallback((next: PaperAnswersMap) => {
    writeEnvelope(KEY, next);
    latest.current = next;
    setAnswers(next);
  }, []);

  return { answers, hydrated, getAnswer, canReveal, setAnswer, replace };
}
