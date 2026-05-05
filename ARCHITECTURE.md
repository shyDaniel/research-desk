# ARCHITECTURE.md — Research Desk

> **STALE — do not trust without cross-referencing the source tree.**
>
> This document still describes the pre-track-split layout (Flashcards,
> Notes, Dashboard, four tabs, multi-feature export bundle, SM-2 scheduler).
> Those features have been removed. The current shape is two pages —
> Curriculum and Papers — scoped per track via `/[track]/...` routes with a
> global TrackSwitcher. See `FINAL_GOAL.md` for the new contract.
> Autopilot should rewrite this file from scratch as part of the polish
> work; until then prefer the source tree and FINAL_GOAL.md as ground truth.

## Shape of the app

Static Next.js 15 App Router app. No server routes, no API, no database.
All user state lives in `localStorage` under a versioned namespace. Content
(curriculum / flashcards / papers) is authored as TypeScript modules under
`src/data/` and bundled at build time.

```
app/
  layout.tsx            root layout, fonts, theme tokens
  page.tsx              redirect to /curriculum (the home tab)
  dashboard/page.tsx    redirect to /curriculum for legacy bookmarks
  (tabs)/
    layout.tsx          persistent sidebar (desktop) + bottom-nav (mobile)
    _components/
      sidebar-nav.tsx   client nav with active-state + aria-current (4 tabs)
    curriculum/page.tsx phase-grouped list with inline rows + filters (home tab)
    flashcards/page.tsx SM-2 deck, flip + 1/2/3/4 grade + drawer (online)
    papers/page.tsx     index of canonical papers (online)
    papers/[slug]/…     per-paper reveal-gated reader (online)
    notes/page.tsx      thin wrapper around NotesEditor (online)
src/
  data/
    curriculum.ts       ≥ 55 curated items, real URLs
    flashcards.ts       ≥ 30 cards with paragraph-length answers
    papers.ts           ≥ 10 canonical papers with editorial summaries
  lib/
    sm2.ts              SM-2 spaced-repetition scheduler (pure functions)
    progress.ts         progress reducer (pure)
    storage.ts          versioned localStorage wrapper + migrations
    notes.ts            notes model: { body: string }, normalize (pure)
    markdown.tsx        safe, small React-native markdown renderer
  components/           presentational components
    notes-editor.tsx    single scratchpad: textarea + live markdown preview
  state/                client-side hooks (useProgress, useCards, useNotes, …)
```

## Routing — four tabs, curriculum as home

The sidebar has exactly four entries: **Curriculum · Flashcards · Papers ·
Notes**. `/curriculum` is the landing page; `/` and `/dashboard` both
issue a server-side `redirect()` to `/curriculum` so legacy bookmarks and
the root URL both resolve to the single home tab. There is no Dashboard
route, no streak widget, and no "Continue" card — content lives on each
tab directly (FINAL_GOAL.md §5: content over UI). `/dashboard` lives
outside the `(tabs)` route group on purpose, so the redirect fires before
the sidebar chrome ever renders.

## Persistence — `research-desk:v1:*`

All keys are namespaced by major schema version. The wrapper in
`src/lib/storage.ts` reads with `{ version, data }` envelopes and:

- returns `null` if the key is missing,
- returns the data if `version === CURRENT`,
- runs a migration function if `version < CURRENT`,
- falls back to empty state (never throws) if the payload is unreadable or
  from a future version.

Keys in v1:

| key                                  | shape                                      |
| ------------------------------------ | ------------------------------------------ |
| `research-desk:v1:progress`          | `Record<itemId, "pending"|"inprog"|"done">`|
| `research-desk:v1:cards`             | `Record<cardId, SM2State>`                 |
| `research-desk:v1:paper-answers`     | `Record<paperId, Record<qId, string>>`     |
| `research-desk:v1:notes`             | `{ body: string }` (single scratchpad)     |
| `research-desk:v1:streak`            | legacy slot; no UI writes it. Preserved in Export/Import for back-compat. |
| `research-desk:v1:item-notes`        | `Record<itemId, string>` (curriculum notes)|

## Content authoring

Content is static TypeScript, imported directly into components. Adding a
new curriculum item is:

1. Append an entry to `src/data/curriculum.ts` with a stable `id`, a real
   `url` (must be on the allow-list; enforced by `curriculum.test.ts`), a
   focus note, and a phase/track tag.
2. Ship. No build step beyond `pnpm build`.

Flashcards and papers follow the same pattern. Tests in
`src/data/__tests__/` enforce structural invariants.

## Theme & aesthetic tokens

Design tokens live in `tailwind.config.ts` (`solar-*` for the Solarized
Light neutral ramp, `coral-*` for the Claude coral accent, and `sol.*` for
the named Solarized semantic accents blue / green / orange / etc.) and in
CSS custom properties in `app/globals.css` (`--bg` = `#FDF6E3`, `--fg` =
`#586E75`, `--accent` = `#D97757`, etc.). Fonts are loaded via
`next/font/google` (Fraunces, Geist, Geist Mono) and exposed as CSS
variables. Dark mode is not supported and is explicitly forbidden by
FINAL_GOAL.md §5.

## MCPs

`.mcp.json` wires `playwright` and `chrome-devtools` MCP servers so the
autopilot judge can drive the real browser and capture performance traces
on later iterations.

## Notes scratchpad

`/notes` is a single persistent markdown scratchpad — FINAL_GOAL.md §3
Page 4 forbids tabs and multiple named pages. `NotesState` in
`src/lib/notes.ts` is exactly `{ body: string }`, persisted under
`research-desk:v1:notes` as `{ version:1, data:{ body:"…" } }`.
`normalizeNotesState` accepts three shapes so a storage payload from
any app version still hydrates cleanly: the canonical `{ body: string }`,
a bare string (also treated as the body), and the legacy
`{ pages: [{id,title,body}, …] }` multi-page shape — legacy bodies are
concatenated with blank lines between them so nothing a user typed
under the old schema is lost on upgrade. Anything else falls back to a
`DEFAULT_BODY` seed. `useNotes` (in `src/state/use-notes.ts`) hydrates
once on mount, writes through with a 250ms debounce, and flushes on
unmount so the last keystroke always survives a tab close. If the
persisted payload isn't already the canonical `{body}` shape, the hook
rewrites it on hydration so downstream readers (and the JSON export)
see one stable envelope. `NotesEditor` (in
`src/components/notes-editor.tsx`) renders one `<textarea>` (Geist
Mono) and the live preview (`renderMarkdown` from
`src/lib/markdown.tsx`) side-by-side on desktop (≥ lg / 1024px); below
that a Write / Preview pill switcher toggles a single column so mobile
stays usable at 375px.

The markdown renderer is deliberately small and pure-React (no
`dangerouslySetInnerHTML`). It covers ATX headings, fenced code,
blockquotes, `- / *` unordered lists, `1.` ordered lists, paragraphs,
and inline `**bold**` / `*italic*` / `` `code` `` / `[text](https://…)`.
Link URLs are scheme-filtered to http(s) before rendering, so
`javascript:` and `data:` payloads in typed notes never become live
anchors. This was chosen over react-markdown + rehype-sanitize because
the surface area is small, the dependency cost is non-trivial, and the
XSS surface is bounded by local-only storage.

## Export / Import JSON

`src/lib/storage.ts` exposes a pure serializer
(`buildExportBundle`, `serializeExportBundle`, `parseImportBundle`,
`summarizeBundle`, `applyImportBundle`) that round-trips every
`research-desk:v1:*` slot through a single
`{ schema: "research-desk", version: 1, exportedAt, data }` envelope.
Slot names are the stable array `EXPORT_SLOT_NAMES = ["progress",
"cards", "paperAnswers", "notes", "streak", "itemNotes"]`. All
functions accept injectable readers / writers so the Vitest suite
can exercise them without touching `window`; defaults use the real
localStorage helpers.

`parseImportBundle` never throws. It returns a discriminated
`ImportParseResult` whose failure side is one of five structured
codes: `invalid-json`, `not-a-bundle` (including arrays / primitives),
`wrong-schema`, `unknown-version`, or `bad-data-shape` (missing slot
key). Null slots in the bundle round-trip as "skip on import" rather
than "wipe", so partial exports don't destroy state that wasn't part
of the payload.

`src/components/data-export-import.tsx` is the visible surface,
rendered as the footer of `/curriculum`. Export uses a blob + temporary anchor click (no
navigation, no iframe). Import pipes a hidden `<input type="file">`
through `FileReader.readAsText`, surfaces malformed files as an
inline `data-export-error` status, and gates a successful parse
behind an inline `role="dialog"` confirmation panel that previews
which of the six slots will be written. Clicking "Overwrite my data"
calls `applyImportBundle` and schedules a `window.location.reload()`
after 400ms so every hook rehydrates from its single source of
truth. A reload is cleaner than calling `replace()` on each hook
individually, and matches what a power user expects from
"Import my data".

## Lighthouse

`lighthouse.json` at the repo root is a committed audit of
`http://localhost:4747/` (the production `pnpm start` server) across
four categories: performance, accessibility, best-practices, SEO. All
four scores are ≥ 0.95 as required by FINAL_GOAL §1. Regenerate by
running `pnpm build && pnpm start &` and then `pnpm
lighthouse` — the `lighthouse` script (in `package.json`) invokes
`lighthouse` against `:4747/` with `--only-categories=performance,
accessibility,best-practices,seo` and writes the report to
`./lighthouse.json`. A headless Chrome launch is used so the audit
runs without a desktop; on macOS the script picks up
`/Applications/Google Chrome.app` through the `CHROME_PATH` env var
if set, otherwise whichever Chrome `chrome-launcher` finds on the
`PATH`.

The root layout sets `robots: { index: true, follow: true }` so the
Lighthouse SEO audit reports "Page can be indexed" (score 1.0). The
app is still intended as a single-user personal tool, but the
metadata stays indexable so the committed Lighthouse report doesn't
regress below the §1 threshold.

## Decisions made at bootstrap

- **Tailwind v3, not v4.** v4 PostCSS plugin layout is still settling; v3
  is production-stable for Next 15 and matches the aesthetic token model
  assumed by the rest of the codebase.
- **Next 15.1 on React 19.** The stable pairing as of 2025-01; App Router
  default.
- **pnpm 10.** Listed in `packageManager` so the lockfile is reproducible.
- **No dynamic runtime.** Every page is statically renderable; no server
  secrets.
