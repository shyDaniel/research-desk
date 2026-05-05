# Research Desk

A personal, static, local-first study tool for the transition from applied
MLE to frontier-lab post-training / RLHF research engineering. Two pages,
two tracks, no accounts — opinionated mentor-voice notes on the papers and
curriculum a research engineer needs at their fingertips.

- **Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind v3, pnpm.
- **Persistence:** `localStorage` only, three versioned slots under
  `research-desk:v1:{progress,paper-answers,item-notes}`.
- **Testing:** Vitest + React Testing Library.
- **Hosting:** static — deployable to Vercel or any static host. No server
  secrets, no API routes, no LLM calls at runtime.

## What's in the box

Two pages, scoped per track via `/[track]/...` routes with a global
RLHF / MLE Fundamentals switcher in the sidebar:

- **Curriculum** — opinionated, mentor-voice focus notes on every row,
  organized by phase (Foundations → PPO & Reward Modeling → DPO family
  + CAI → Reasoning RL → End-to-end). Every item has a real URL, a
  time estimate, prerequisites, and a `pending → in-progress → done`
  cycle persisted to `localStorage`. Each row also has an inline
  scratch textarea for personal annotations.
  - **RLHF track:** 44 items across the path.
  - **MLE Fundamentals track:** 11 items covering distributed training,
    GPU systems, and eval infra (the small set of MLE papers an RE
    must know to read RLHF work critically).
- **Papers** — 11 canonical papers total (9 RLHF + 2 MLE
  Fundamentals: ZeRO and FlashAttention) with 3–6 sentence editorial
  summaries and 5–7 pointed comprehension questions each. Every
  question is "walk through X" or "explain why Y" form. The reader's
  per-question textarea autosaves; the **Reveal my answer** button
  unlocks at ≥ 40 characters so you grade yourself against the paper.

## Routing

```
/                         → redirects to /rlhf/curriculum
/[track]/curriculum       → curriculum scoped to one track
/[track]/papers           → paper grid scoped to one track
/[track]/papers/[slug]    → paper reader (summary + questions)
```

`[track]` ∈ {`rlhf`, `mle`}. Unknown values 404. Switching tracks
preserves the current sub-route (`/rlhf/papers` ↔ `/mle/papers`).

## Setup

```bash
pnpm install
pnpm dev          # http://localhost:4747
```

## Build & run locally

```bash
pnpm build
pnpm start        # production server on :4747
```

## Quality gates

```bash
pnpm lint         # ESLint, zero warnings
pnpm typecheck    # tsc --noEmit, strict
pnpm test         # Vitest — 69 / 69
```

## Lighthouse

A committed report lives at [`lighthouse.json`](./lighthouse.json).

To regenerate:

```bash
pnpm build
pnpm start &              # serve the production build on :4747
pnpm lighthouse           # writes lighthouse.json at repo root
```

The `lighthouse` script runs headless Chrome against
`http://localhost:4747/` and emits the four category scores
(performance, accessibility, best-practices, SEO) to
`./lighthouse.json`.

## Deploy

Research Desk is a static Next.js app — no server routes, no API, no
database, no secrets. Any static host with a Next.js adapter works.

### Vercel (recommended)

```bash
pnpm dlx vercel            # interactive first deploy
pnpm dlx vercel --prod     # production release
```

No environment variables, no project settings beyond framework
auto-detection (Vercel picks up Next.js). Build command:
`pnpm build`. Output directory: `.next` (Vercel's default for
Next.js).

### Netlify / Cloudflare Pages

`pnpm build` then serve `.next` via the host's Next.js adapter
(`@netlify/plugin-nextjs`, Cloudflare Pages' Next.js adapter). No
custom headers required. `localStorage` is the only storage surface.

## What lives where

- `app/[track]/curriculum/page.tsx` — curriculum page for the active
  track.
- `app/[track]/papers/page.tsx` — paper grid for the active track.
- `app/[track]/papers/[slug]/page.tsx` — paper reader (summary +
  questions + per-question textarea).
- `app/[track]/layout.tsx` and `app/[track]/_components/` — the
  sidebar, TrackSwitcher segmented control, and shared chrome.
- `src/data/curriculum.ts` — the 55 curriculum items (44 RLHF + 11
  MLE Fundamentals) with focus notes, URLs, prerequisites.
- `src/data/papers.ts` — the 11 papers (9 RLHF + 2 MLE Fundamentals)
  with summaries and question prompts.
- `src/data/types.ts` — `Track`, `CurriculumItem`, `Paper` shapes.
- `src/lib/track.ts` — `parseTrackSlug` / `slugToTrack` / track
  metadata used by every route.
- `src/lib/progress.ts` — pure reducer for the per-item
  `pending → in-progress → done → pending` cycle.
- `src/lib/storage.ts` — versioned `localStorage` envelope with
  graceful fallback on bad payloads. Three slots only:
  `progress`, `paper-answers`, `item-notes`.
- `src/lib/markdown.tsx` — pure-React markdown renderer with a
  scheme allow-list (no `dangerouslySetInnerHTML`).
- `src/data/__tests__/` and `src/lib/__tests__/` — the Vitest
  invariants (URL allow-list, focus-note length, paper question
  form, storage round-trip, progress reducer, markdown XSS guard,
  track parsing).
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — data model, persistence,
  how to add content.
- [`FINAL_GOAL.md`](./FINAL_GOAL.md) — hard acceptance criteria.
- [`WORKLOG.md`](./WORKLOG.md) — append-only iteration log.

## Aesthetic

Solarized Light (`#FDF6E3` cream base, `#EEE8D5` parchment panels,
`#586E75` slate text) with a coral accent (`#D97757`) for CTAs,
active states, and progress fills. Serif headings (Fraunces), sans
body (Geist), mono identifiers (Geist Mono) in Solarized blue
`#268BD2`. No dark mode, no purple, no pure white. Section labels
use uppercase letter-spacing (`tracking-widest`) at 11–12px — a
Solarized-UI convention.

## Non-goals

- No accounts, no auth, no multi-user.
- No backend, no LLM calls at runtime. Everything runs from static
  files + `localStorage`.
- No mobile native app.
