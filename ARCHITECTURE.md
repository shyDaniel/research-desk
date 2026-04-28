# ARCHITECTURE.md — Research Desk

## Shape of the app

Static Next.js 15 App Router app. No server routes, no API, no database.
All user state lives in `localStorage` under a versioned namespace. Content
(curriculum / flashcards / papers) is authored as TypeScript modules under
`src/data/` and bundled at build time.

```
app/
  layout.tsx            root layout, fonts, theme tokens
  page.tsx              marketing landing (the only non-(tabs) route)
  (tabs)/
    layout.tsx          persistent sidebar (desktop) + bottom-nav (mobile)
    _components/
      sidebar-nav.tsx   client nav with active-state + aria-current
      tab-stub.tsx      "shipping next" shell for tabs without full UIs yet
    dashboard/page.tsx  phase-index dashboard (online)
    curriculum/page.tsx (stub until the list UI ships)
    flashcards/page.tsx (stub until SM-2 ships)
    papers/page.tsx     (stub until paper pages ship)
    notes/page.tsx      (stub until the notebook ships)
src/
  data/
    curriculum.ts       ≥ 55 curated items, real URLs
    flashcards.ts       ≥ 30 cards with paragraph-length answers
    papers.ts           ≥ 10 canonical papers with editorial summaries
  lib/
    sm2.ts              SM-2 spaced-repetition scheduler (pure functions)
    progress.ts         progress reducer (pure)
    storage.ts          versioned localStorage wrapper + migrations
  components/           presentational components
  state/                client-side hooks (useProgress, useCards, …)
```

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
| `research-desk:v1:notes`             | `{ pages: { id, title, body }[] }`         |
| `research-desk:v1:streak`            | `{ days: string[] /* ISO dates */ }`       |

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

## Decisions made at bootstrap

- **Tailwind v3, not v4.** v4 PostCSS plugin layout is still settling; v3
  is production-stable for Next 15 and matches the aesthetic token model
  assumed by the rest of the codebase.
- **Next 15.1 on React 19.** The stable pairing as of 2025-01; App Router
  default.
- **pnpm 10.** Listed in `packageManager` so the lockfile is reproducible.
- **No dynamic runtime.** Every page is statically renderable; no server
  secrets.
