// src/lib/notes.ts
//
// Pure data model + helpers for the /notes notebook. FINAL_GOAL.md §3.5
// mandates a free-form markdown notebook with ≥3 named pages, autosave, and
// a side-by-side markdown preview on desktop / tabbed on mobile.
//
// Persistence envelope lives in research-desk:v1:notes shaped as:
//   { version: 1, data: { pages: [{ id, title, body }] } }
//
// This module is pure — no React, no DOM, no localStorage access — so it can
// be unit-tested in the node environment and composed from the hook layer.

export interface NotePage {
  id: string;
  title: string;
  body: string;
}

export interface NotesState {
  pages: NotePage[];
}

/** The three named pages the spec requires to be present on first load. */
export const DEFAULT_PAGES: readonly NotePage[] = Object.freeze([
  Object.freeze({
    id: "notes",
    title: "Notes",
    body: [
      "# Notes",
      "",
      "The main notebook. Write in markdown — headings, lists, code fences, **bold**, *italic*, `inline code`.",
      "",
      "Autosaves as you type. No save button.",
      "",
      "## What goes here",
      "",
      "- Open questions from curriculum items",
      "- Derivations you couldn't fit in a flashcard answer",
      "- Quotes from papers worth returning to",
      "",
      "Switch pages in the left column on desktop, or the tab bar on mobile.",
    ].join("\n"),
  }),
  Object.freeze({
    id: "scratch",
    title: "Scratch",
    body: [
      "# Scratch",
      "",
      "Throwaway space. Paste log dumps, half-thoughts, shell snippets.",
      "",
      "```",
      "accelerate launch --num_processes 8 train.py",
      "```",
      "",
      "Nothing here has to survive the week.",
    ].join("\n"),
  }),
  Object.freeze({
    id: "weekly-log",
    title: "Weekly log",
    body: [
      "# Weekly log",
      "",
      "One section per week. What you read, what you ran, what you got stuck on.",
      "",
      "## Week of …",
      "",
      "- **Read:** ",
      "- **Ran:** ",
      "- **Stuck on:** ",
      "- **Next week:** ",
    ].join("\n"),
  }),
]);

/** Returns a fresh mutable copy of the default pages. */
export function initialNotesState(): NotesState {
  return {
    pages: DEFAULT_PAGES.map((p) => ({ id: p.id, title: p.title, body: p.body })),
  };
}

/**
 * Coerce an untyped stored payload (or `null`) into a valid NotesState.
 * Guarantees ≥ 3 named pages by merging any missing default pages back in,
 * so a hand-edited or partial localStorage payload never strands the user
 * without the required page set.
 */
export function normalizeNotesState(input: unknown): NotesState {
  const base = initialNotesState();
  if (
    typeof input !== "object" ||
    input === null ||
    !("pages" in input) ||
    !Array.isArray((input as { pages: unknown }).pages)
  ) {
    return base;
  }
  const raw = (input as { pages: unknown[] }).pages;
  const clean: NotePage[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as { id?: unknown }).id !== "string" ||
      typeof (entry as { title?: unknown }).title !== "string" ||
      typeof (entry as { body?: unknown }).body !== "string"
    ) {
      continue;
    }
    const { id, title, body } = entry as NotePage;
    if (seen.has(id) || id.length === 0) continue;
    seen.add(id);
    clean.push({ id, title, body });
  }
  // Guarantee every required default page is present (append missing ones).
  for (const def of DEFAULT_PAGES) {
    if (!seen.has(def.id)) {
      clean.push({ id: def.id, title: def.title, body: def.body });
      seen.add(def.id);
    }
  }
  return { pages: clean };
}

/** Update a single page's body by id. Pure. */
export function setPageBody(
  state: NotesState,
  pageId: string,
  body: string
): NotesState {
  let changed = false;
  const pages = state.pages.map((p) => {
    if (p.id !== pageId) return p;
    changed = true;
    return { ...p, body };
  });
  return changed ? { pages } : state;
}
