"use client";

// src/state/use-item-notes.ts
//
// Free-text per-curriculum-item notes persisted at
// research-desk:v1:item-notes as Record<itemId, string>. Used by the
// curriculum side-sheet. Autosave is 250ms debounced so typing doesn't
// stampede localStorage.

import { useCallback, useEffect, useRef, useState } from "react";

import { STORAGE_KEYS, readEnvelope, writeEnvelope } from "@/lib/storage";

const KEY = STORAGE_KEYS.itemNotes;

type NotesMap = Record<string, string>;

interface UseItemNotesResult {
  notes: NotesMap;
  hydrated: boolean;
  setNote: (itemId: string, value: string) => void;
  replace: (next: NotesMap) => void;
}

export function useItemNotes(): UseItemNotesResult {
  const [notes, setNotes] = useState<NotesMap>({});
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initial = readEnvelope<NotesMap>(KEY, {});
    setNotes(initial);
    setHydrated(true);
  }, []);

  // Flush on unmount so the last keystroke always persists.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, []);

  const setNote = useCallback((itemId: string, value: string) => {
    setNotes((prev) => {
      const next: NotesMap = { ...prev };
      if (value.length === 0) {
        delete next[itemId];
      } else {
        next[itemId] = value;
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        writeEnvelope(KEY, next);
      }, 250);
      return next;
    });
  }, []);

  const replace = useCallback((next: NotesMap) => {
    writeEnvelope(KEY, next);
    setNotes(next);
  }, []);

  return { notes, hydrated, setNote, replace };
}
