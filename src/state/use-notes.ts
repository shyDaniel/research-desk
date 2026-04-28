"use client";

// src/state/use-notes.ts
//
// React hook that hydrates the /notes notebook from
// research-desk:v1:notes (envelope `{version:1, data:{pages:[...]}}`)
// and writes through on each edit. Autosave is debounced at ~250ms so
// typing doesn't stampede localStorage. Flushes on unmount so the very
// last keystroke never races a tab-close.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_PAGES,
  initialNotesState,
  normalizeNotesState,
  setPageBody,
  type NotePage,
  type NotesState,
} from "@/lib/notes";
import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.notes;
const DEBOUNCE_MS = 250;

export interface UseNotesResult {
  state: NotesState;
  hydrated: boolean;
  pages: NotePage[];
  setBody: (pageId: string, body: string) => void;
  replace: (next: NotesState) => void;
}

/** Hook that owns the notebook state. SSR-safe: no storage access until mount. */
export function useNotes(): UseNotesResult {
  // Start with the default pages so the first paint has real tab labels,
  // not empty arrays. Hydration below swaps in persisted content if present.
  const [state, setState] = useState<NotesState>(() => initialNotesState());
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<NotesState>(state);

  // Hydrate exactly once on mount. Read whatever was persisted and normalise
  // it so a partial payload still has all three required default pages.
  useEffect(() => {
    const raw = readEnvelope<unknown>(KEY, null);
    const next = normalizeNotesState(raw);
    setState(next);
    latest.current = next;
    setHydrated(true);
    // If the persisted payload was missing any default page, write the
    // normalised version back immediately so downstream readers see the
    // canonical envelope without waiting for the user to type.
    if (raw === null || !shapeMatches(raw, next)) {
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

  const setBody = useCallback((pageId: string, body: string) => {
    setState((prev) => {
      const next = setPageBody(prev, pageId, body);
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

  return { state, hydrated, pages: state.pages, setBody, replace };
}

// Best-effort shape check so we only write-back when the persisted payload
// was missing default pages or malformed — avoids a pointless write on every
// mount when the data is already canonical.
function shapeMatches(raw: unknown, normalised: NotesState): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const pages = (raw as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return false;
  if (pages.length !== normalised.pages.length) return false;
  for (let i = 0; i < pages.length; i += 1) {
    const p = pages[i];
    if (typeof p !== "object" || p === null) return false;
    const q = p as { id?: unknown; title?: unknown; body?: unknown };
    const n = normalised.pages[i];
    if (!n) return false;
    if (q.id !== n.id || q.title !== n.title || q.body !== n.body) return false;
  }
  return true;
}

/** Re-export for call-sites (e.g. tests) that want the default set. */
export { DEFAULT_PAGES };
