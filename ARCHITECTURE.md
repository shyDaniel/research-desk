# ARCHITECTURE.md — Research Desk

A static Next.js 15 App Router app. Two pages (Curriculum, Papers) scoped
per track (RLHF, MLE Fundamentals) under `/[track]/...`. No server routes,
no API, no database, no LLM at runtime — every byte the user sees is
authored TypeScript bundled at build time, and every byte of state the
user produces is `localStorage` under one versioned namespace. The product
contract lives in `FINAL_GOAL.md`; this file is the engineering map.

## Routes

```
app/
  layout.tsx                     root html, fonts, global metadata
  page.tsx                       redirect("/rlhf/curriculum")
  globals.css                    Solarized Light + coral tokens
  icon.svg                       favicon
  [track]/
    layout.tsx                   sidebar + mobile bottom-nav, TrackSwitcher
    _components/
      sidebar-nav.tsx            two-entry nav (Curriculum, Papers)
      track-switcher.tsx         segmented control (RLHF | MLE Fundamentals)
    curriculum/page.tsx          phase-grouped list, inline notes + cycle
    papers/page.tsx              paper grid for the active track
    papers/[slug]/page.tsx       per-paper reader (summary + reveal-gated Q's)
```

`[track]` is parsed by `parseTrackSlug` (see below) — only `"rlhf"` and
`"mle"` resolve; everything else `notFound()`s. `app/[track]/layout.tsx`
calls `generateStaticParams` so both tracks pre-render at build time.

The only redirect is `/` → `/rlhf/curriculum`. There is no `/dashboard`
route and no `(tabs)` route group; Curriculum and Papers are the only
visible surfaces.

## Track pipeline — `src/lib/track.ts`

Tracks are the single global axis of the product. The pipeline is:

```
URL slug ──parseTrackSlug──▶ TrackSlug ──slugToTrack──▶ Track ──TRACK_META──▶ {label, tagline}
   "rlhf" / "mle"            ("rlhf"|"mle")            ("RLHF"|"MLE-Fundamentals")
```

- `TRACK_SLUGS = ["rlhf", "mle"] as const`
- `parseTrackSlug(value: string): TrackSlug | null` — narrowing guard used
  by every page + the layout to gate on `notFound()`.
- `slugToTrack(slug)` / `trackToSlug(track)` — round-trip between the URL
  form and the authored `Track` literal type from `src/data/types.ts`.
- `TRACK_META[slug]` — `{ track, label, tagline }`. The tagline is the
  exact string rendered in the sidebar caption and (case-flipped on the
  first letter so acronyms like "RL" and "GPU" stay upper-case) in the
  curriculum H1. Casing is asserted by `src/lib/__tests__/track.test.ts`.

`Track` itself (`"RLHF" | "MLE-Fundamentals"`) is the authored value on
every `CurriculumItem` and `Paper`. URL slug is purely the routing form.

## Persistence — `research-desk:v1:*`

All client state is `localStorage`, all under one major-version namespace.
Three keys, no more:

| key                                | shape                                             |
| ---------------------------------- | ------------------------------------------------- |
| `research-desk:v1:progress`        | `Record<itemId, "pending" \| "inprog" \| "done">` |
| `research-desk:v1:paper-answers`   | `Record<paperSlug, Record<questionId, string>>`   |
| `research-desk:v1:item-notes`      | `Record<itemId, string>`                          |

`src/lib/storage.ts` wraps every value in `{ version: 1, data }` and
exposes:

- `readEnvelope<T>(key, fallback, migrations?) → T` — SSR-safe, never
  throws; returns `fallback` on missing key, unparseable JSON, wrong
  envelope shape, future version, or migration error.
- `writeEnvelope<T>(key, data)` — also SSR-safe; quota / private-mode
  errors are swallowed silently (the user types and the page keeps
  working — losing the last keystroke beats crashing).
- `parseEnvelope<T>(raw, fallback, migrations?)` — pure version,
  exercised in tests without touching `window`.
- `clearKey(key)` — the only mutation surface beyond writes.

`STORAGE_KEYS` is the single source of truth for the three slot names.
The simplification is the point (`FINAL_GOAL.md` §3) — there is no
serialized JSON round-trip and no other persisted slots.

State is wired to React through three thin hooks under `src/state/`:

- `use-progress.ts` — reducer over the progress map. `cycle(itemId)`
  advances `pending → inprog → done → pending` via the pure
  `cycleProgress` reducer (`src/lib/progress.ts`); `pending` items are
  deleted from the persisted map so the blob stays small. Hydrates once
  on mount; SSR renders the empty default and the client upgrades.
- `use-paper-answers.ts` — `Record<paperSlug, Record<qId, string>>` with
  a 250 ms debounced write-through, an unmount flush so the last
  keystroke survives navigation, and a `canReveal(slug, qid)` predicate
  bound to `REVEAL_THRESHOLD = 40` (the constant the UI's reveal gate
  reads, so test and product cannot drift).
- `use-item-notes.ts` — `Record<itemId, string>` with the same 250 ms
  debounced write-through. Empty values delete the key.

## Authored content — `src/data/`

```
src/data/
  types.ts            Track, Phase, CurriculumType, CurriculumItem, HOST_ALLOWLIST
  curriculum.ts       authored items (≥ 40 RLHF + ≥ 8 MLE) across 5 phases
  papers.ts           authored papers (≥ 8 RLHF + ≥ 2 MLE) with editorial summaries
  __tests__/
    curriculum.test.ts  structural Vitest invariants
    papers.test.ts      structural Vitest invariants
```

Every curriculum row is one `CurriculumItem`: stable kebab-case `id`,
`title`, `type`, `phase ∈ {1..5}`, `track ∈ {RLHF, MLE-Fundamentals}`,
`url` on the `HOST_ALLOWLIST`, `timeEstimate`, `focusNote` (≥ 200 chars,
ending in `Self-check: …`), and resolved `prerequisites: string[]`.

Every paper is one `Paper`: `slug`, `title`, `authors`, `venue`, `year`,
`url`, `track`, `summary` (≥ 200 chars), `questions: Array<{ id,
prompt }>` of length 5–7. Per `FINAL_GOAL.md` §4 every prompt is
"walk through X" / "explain why Y" / "explain how Z" form.

## Structural invariants — `src/data/__tests__/`

The test suite is the contract; `pnpm test` is the floor for every
commit. The load-bearing invariants are:

**`curriculum.test.ts`**
- ≥ 55 items, unique ids, every prereq id resolves, no cycles in the
  prereq DAG.
- Every URL matches `^https?://` and its host is on `HOST_ALLOWLIST`
  (the URL allow-list).
- Every `focusNote` is ≥ 200 chars, placeholder-free
  (no `lorem|todo|fixme|xxx`), and ends with `Self-check: <≥ 25 char
  question>` — generic "understand X" tails fail this gate.
- Per-phase counts in the FINAL_GOAL `[lo, hi]` envelope (P1 8–12,
  P2 10–14, P3 8–11, P4 8–11, P5 8–12); every phase has at least one
  RLHF item.

**`papers.test.ts`**
- ≥ 10 papers, unique kebab-case slugs, ten canonical slugs all present
  (instructgpt, ppo, christiano-2017, dpo, constitutional-ai,
  deepseek-r1, lets-verify, zero, flashattention, rlaif).
- Every URL matches `^https?://` and is on `HOST_ALLOWLIST`.
- Every summary is ≥ 200 chars, placeholder-free.
- Every paper has 5–7 questions; every prompt is ≥ 20 chars,
  placeholder-free, kebab-case `id`, unique within its paper.
- The paper-question shape guard: no prompt opens with `^\s*what\s+does\b`
  and no prompt anywhere matches the `\bstand(s)?\s+for\b` idiom (the
  acronym-definition trivia FINAL_GOAL §4 forbids by name). Mid-prompt
  consequence framings — "what does this imply / tell you / buy you" —
  are deliberately not banned.
- Both tracks represented; `track ∈ {RLHF, MLE-Fundamentals}`.

## Other tests — `src/lib/__tests__/`

- `progress.test.ts` — `cycleProgress` cycle semantics; `pending` items
  removed from the map; `setProgress`, `getProgress`, `summarize`.
- `storage.test.ts` — envelope round-trip, missing key, unparseable
  JSON, wrong shape, future-version fallback, forward-migration
  composition, migration-throws fallback.
- `markdown.test.ts` — XSS guard. Headings h1..h6, fenced code,
  blockquotes, ul/ol, paragraph accumulation, `**bold**` / `*italic*` /
  `` `code` `` / `[text](url)` inline; `javascript:` and `data:` hrefs
  are scheme-rejected before becoming live anchors. The renderer never
  uses `dangerouslySetInnerHTML`.
- `track.test.ts` — `TRACK_META` taglines literally contain "RL" and
  "GPU" (and lack the lowercase forms — guards against any future
  page renderer reaching for `.toLowerCase()`); round-trips
  `parseTrackSlug` / `slugToTrack` / `trackToSlug`.

## Markdown renderer — `src/lib/markdown.tsx`

Small, pure-React markdown renderer used by the curriculum focus notes
and paper summaries. Supported subset: ATX headings (`#`..`######`),
fenced code (` ```lang `), blockquotes, `-`/`*` unordered lists, `1.`
ordered lists, paragraphs (blank-line separated); inline `**bold**`,
`*italic*`, `` `code` ``, `[text](url)`. Every node is a real React
element — `dangerouslySetInnerHTML` is never called. URLs are
scheme-filtered to `http(s)` before being rendered as `<a href>`, so a
typed `javascript:` or `data:` payload never becomes a live link.
Library was rejected (react-markdown + rehype-sanitize) because the
surface area is small and the dependency cost was non-trivial for a
local-only product.

## Theme

Tokens live in `tailwind.config.ts` (`solar-*` Solarized Light neutral
ramp `#FDF6E3..#002B36`, `coral-*` Claude coral with `#D97757` at 500,
`sol.{blue,green,orange,…}` semantic accents) and as CSS custom
properties in `app/globals.css` (`--bg #FDF6E3`, `--fg #586E75`,
`--accent #D97757`, etc.). Fonts are loaded via `next/font/google`
(Fraunces serif body, Geist sans, Geist Mono accents) and exposed as
CSS variables on `<html>`. Dark mode is not supported.

## Deploy story

Static. `pnpm dev`, `pnpm start`, and the lighthouse audit all run on
port **4747** (`package.json` scripts). `pnpm build && pnpm start`
serves the production build with no server-side secrets and no API
routes; the bundle is deployable to Vercel, Netlify, or any static host
as-is. Every page is statically renderable (the redirect is a server
action that fires before any chrome) and `app/[track]/layout.tsx`'s
`generateStaticParams` pre-renders both track shells at build time.

## Decisions made at bootstrap

- **Tailwind v3, not v4.** v4's PostCSS layout was still settling at
  bootstrap; v3 is production-stable for Next 15 and matches the
  aesthetic-token model the codebase assumes.
- **Next 15 on React 19.** App Router, `app/`-only, no `pages/`.
- **pnpm 10**, pinned in `packageManager` so the lockfile is
  reproducible.
- **No dynamic runtime, no API routes, no LLM at runtime.** Every
  visible string is authored TypeScript; every persisted byte is
  client-side `localStorage`.
