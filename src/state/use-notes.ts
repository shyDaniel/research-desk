"use client";

// src/state/use-notes.ts
//
// React hook that hydrates the /notes scratchpad from
// research-desk:v1:notes (envelope `{version:1, data:{body:"…"}}`) and
// writes through on each edit. Autosave is debounced at ~250ms so typing
// doesn't stampede localStorage. Flushes on unmount so the very last
// keystroke never races a tab-close.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  initialNotesState,
  normalizeNotesState,
  setBody as setBodyPure,
  type NotesState,
} from "@/lib/notes";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.notes;
const DEBOUNCE_MS = 250;

export interface UseNotesResult {
  state: NotesState;
  hydrated: boolean;
  body: string;
  setBody: (body: string) => void;
  replace: (next: NotesState) => void;
}

/** Hook that owns the scratchpad state. SSR-safe: no storage access until mount. */
export function useNotes(): UseNotesResult {
  // Start with the default seed so the first paint has real text, not an
  // empty box. Hydration below swaps in the persisted body if present.
  const [state, setState] = useState<NotesState>(() => initialNotesState());
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<NotesState>(state);

  // Hydrate exactly once on mount. Read whatever was persisted and normalise
  // it so a legacy `{pages:[…]}` payload migrates forward into the single
  // body string rather than stranding the user with the seed default.
  useEffect(() => {
    const raw = readEnvelope<unknown>(KEY, null);
    const next = normalizeNotesState(raw);
    setState(next);
    latest.current = next;
    setHydrated(true);
    // If the persisted shape wasn't already `{ body: string }`, rewrite it
    // so every subsequent reader (and the JSON export) sees the canonical
    // single-body envelope.
    if (!isCanonicalBodyShape(raw)) {
      writeEnvelope(KEY, next);
    }
  }, []);

  // Flush any pending write on unmount so the last keystroke persists.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        writeEnvelope(KEY, latest.current);
      }
    };
  }, []);

  const setBody = useCallback((body: string) => {
    setState((prev) => {
      const next = setBodyPure(prev, body);
      latest.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        writeEnvelope(KEY, latest.current);
        timer.current = null;
      }, DEBOUNCE_MS);
      return next;
    });
  }, []);

  const replace = useCallback((next: NotesState) => {
    const normalised = normalizeNotesState(next);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    writeEnvelope(KEY, normalised);
    latest.current = normalised;
    setState(normalised);
  }, []);

  return { state, hydrated, body: state.body, setBody, replace };
}

// Returns true iff the raw persisted payload is already `{ body: string }`
// (no other keys), so we can skip a pointless write-back on every mount.
function isCanonicalBodyShape(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.length !== 1 || keys[0] !== "body") return false;
  return typeof (raw as { body: unknown }).body === "string";
}
