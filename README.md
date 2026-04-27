# Research Desk

A personal, static, local-first learning OS for transitioning from applied
MLE to frontier-lab post-training / RLHF research engineering.

- **Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind v3, pnpm.
- **Persistence:** `localStorage` with a versioned schema
  (`research-desk:v1:*`), JSON export/import.
- **Testing:** Vitest + React Testing Library.
- **Hosting:** static — deployable to Vercel or any static host. No server
  secrets required. No LLM calls at runtime.

## Setup

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Build & run

```bash
pnpm build
pnpm start        # production server on :3000
```

## Quality gates

```bash
pnpm lint         # ESLint (zero warnings)
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
```

## What lives where

- `app/` — App Router pages. The bootstrap iteration ships the landing
  shell; Dashboard / Curriculum / Flashcards / Papers / Notes tabs land in
  subsequent iterations.
- `src/` — data (`src/data/curriculum.ts`, flashcards, papers) and pure
  logic (SM-2 scheduler, progress reducer) as they come online.
- `ARCHITECTURE.md` — data model, persistence, how to add content.
- `WORKLOG.md` — append-only log of iterations.
- `FINAL_GOAL.md` — hard acceptance criteria for the product.

## Aesthetic

Dark editorial. Warm near-black (`#0f0e0c`), cream text (`#f1ece0`), a
single amber accent. Fraunces serif headings, Geist Sans body, Geist Mono
for identifiers. SVG grain on background surfaces. No purple, no generic
chatbot dark mode.
