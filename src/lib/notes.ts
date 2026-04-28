// src/lib/notes.ts
//
// Pure data model for the /notes scratchpad. FINAL_GOAL.md §3 Page 4 mandates
// a single persistent markdown scratchpad — "No multiple named pages. No
// tabs. Just one persistent scratchpad." The state therefore reduces to a
// single `body: string` under `research-desk:v1:notes`.
//
// This module is pure — no React, no DOM, no localStorage access — so it can
// be unit-tested in the node environment and composed from the hook layer.

export interface NotesState {
  body: string;
}

/**
 * The seed body shown on first load. Written in the same mentor voice as the
 * rest of the app so a fresh user isn't staring at an empty textarea. The
 * first edit replaces this wholesale; it is never restored once overwritten.
 */
export const DEFAULT_BODY: string = [
  "# Notebook",
  "",
  "Free-form markdown. Headings, lists, code fences, **bold**, *italic*, `inline code`.",
  "Autosaves as you type — no save button.",
  "",
  "## What goes here",
  "",
  "- Open questions from curriculum items",
  "- Derivations that wouldn't fit on a flashcard",
  "- Paper quotes worth returning to",
  "- Weekly log: what you read, what you ran, what you got stuck on",
  "",
  "Everything is persisted to `research-desk:v1:notes` in your browser.",
].join("\n");

/** Returns a fresh default state. */
export function initialNotesState(): NotesState {
  return { body: DEFAULT_BODY };
}

/**
 * Coerce an untyped stored payload (or `null`) into a valid NotesState.
 *
 * Accepts three shapes, in order of preference:
 *   1. The canonical `{ body: string }` envelope payload.
 *   2. A raw string — treated as the body directly.
 *   3. Legacy `{ pages: [{ id, title, body }, …] }` multi-page state (from
 *      the pre-simplification schema): the bodies are concatenated with
 *      blank lines between them so nothing written before the collapse is
 *      lost when the user opens /notes for the first time after upgrade.
 *
 * Anything else (numbers, arrays, objects missing both `body` and `pages`)
 * falls back to the default seed body.
 */
export function normalizeNotesState(input: unknown): NotesState {
  if (typeof input === "string") {
    return { body: input };
  }
  if (typeof input === "object" && input !== null) {
    const obj = input as { body?: unknown; pages?: unknown };
    if (typeof obj.body === "string") {
      return { body: obj.body };
    }
    if (Array.isArray(obj.pages)) {
      const bodies: string[] = [];
      for (const entry of obj.pages) {
        if (
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { body?: unknown }).body === "string"
        ) {
          const body = (entry as { body: string }).body;
          if (body.length > 0) bodies.push(body);
        }
      }
      if (bodies.length > 0) {
        return { body: bodies.join("\n\n") };
      }
    }
  }
  return initialNotesState();
}

/** Replace the body. Pure — returns a new state object. */
export function setBody(state: NotesState, body: string): NotesState {
  if (state.body === body) return state;
  return { body };
}
