# FINAL_GOAL.md — Research Desk

A personal study tool for Hanyu as he transitions from traditional MLE to a
Research Engineer role at a frontier lab. Two parallel tracks, picked once at
the top of the app:

- **RLHF** — post-training, preference optimization, reasoning RL. The path
  from InstructGPT through DeepSeek-R1.
- **MLE Fundamentals** — the small set of distributed-training and GPU-systems
  papers an RE must know to read RLHF work critically.

**PRIME DIRECTIVE — in priority order:**

1. **Core content is the whole product.** Curriculum focus notes and paper
   summaries must read like a senior RE walking Hanyu through a book chapter:
   opinionated, dense, citing the load-bearing equation or section, and ending
   with one self-check question. Not a Wikipedia abstract. Not flamboyant
   marketing prose. **Polish, then polish again.** Every time the worker runs,
   the eval skill should be able to find one more rough item to deepen.
2. **Tracks are completely separate.** Track is selected once, globally, at the
   top of the app. Every page (curriculum, papers) shows only that track's
   content. No per-tab Track filter, no mixed tabs, no cross-track surfaces.
3. **Two pages, nothing more.** Curriculum and Papers. No Flashcards, no
   Notes, no Dashboard, no Export/Import, no streaks, no widgets. If a
   feature does not directly help Hanyu read better, it does not exist.
4. **It works reliably.** Persistence, navigation, and core interactions
   bug-free. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all
   green at every commit boundary.

## User

- Senior ML engineer, passed Meta MLE bar. Strong on inference/serving
  (vLLM, KV cache, quantization). Zero production training experience.
- Joining OpenAI Scaled Abuse team. Goal: transfer to post-training /
  safety research within 12–18 months.
- Uses this app daily, alone, on desktop. Mobile must work but is secondary.

## Hard Acceptance Criteria

### 1. Tech

- Next.js 15, TypeScript, Tailwind, pnpm. App Router.
- `pnpm install && pnpm build && pnpm start` succeed from clean clone.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass, zero errors.
- Dev / start / lighthouse all run on port **4747**.
- No server-side secrets. Deployable to Vercel as-is.

### 2. Persistence

Three localStorage slots only, all under `research-desk:v1:*`:

- `progress` — per-item curriculum state (pending / in-progress / done).
- `paper-answers` — per-question textarea content for the paper questions.
- `item-notes` — per-curriculum-row scratch annotations (the inline textarea).

No flashcards persistence. No notes-page persistence. No streak. No export
bundle. The simplification is the point — there is no Export/Import button
anywhere.

### 3. Routing

```
/                         → redirects to /rlhf/curriculum
/[track]/curriculum       → curriculum scoped to one track
/[track]/papers           → paper grid scoped to one track
/[track]/papers/[slug]    → paper reader (editorial summary + questions)
```

`[track]` ∈ {`rlhf`, `mle`}. Unknown values 404.

The header (desktop sidebar; mobile top bar) contains a **TrackSwitcher**
segmented control with two tabs: RLHF and MLE Fundamentals. Clicking a tab
preserves the current sub-route (`/rlhf/papers` ↔ `/mle/papers`).

The sidebar / bottom-nav has exactly two entries: **Curriculum** and **Papers**.
No Flashcards entry. No Notes entry. No Dashboard.

### 4. Content — this is what actually matters

#### Curriculum

Every curriculum row is one section of an opinionated mentor book.

- **`focusNote` (required, ≥ 200 characters):** 4–8 sentences. Written as if
  Hanyu is sitting next to you and asked "what should I actually look for in
  this?" Lead with one sentence on why this item exists in the path, then 2–4
  sentences on the load-bearing idea (**cite the actual section, equation,
  figure, table, algorithm, appendix, line, or filename — this is enforced**),
  then end with a one-sentence self-check ("Self-check: …"). No marketing
  prose, no abstract paraphrase, no "let's explore" framing.
- A real URL on the host allow-list (no placeholder domains).
- A time estimate.
- Prerequisite IDs that resolve to other items.

Phase shape (RLHF track):
- **Phase 1 — Foundations**: Sutton & Barto Ch 1–6, 13; Spinning Up; KL,
  importance sampling; InstructGPT as the first end-to-end read. Everything
  the rest of the path presumes you have at your fingertips.
- **Phase 2 — PPO & Reward Modeling**: PPO + Costa Huang's 37 details,
  Christiano 2017, Bradley-Terry RMs, calibration, length bias. UltraFeedback.
- **Phase 3 — DPO family & CAI**: DPO derivation, IPO, KTO, SimPO,
  Constitutional AI, RLAIF, self-rewarding LMs.
- **Phase 4 — Reasoning RL**: PRMs vs ORMs, DeepSeek-R1, GRPO, rule-based
  rewards.
- **Phase 5 — End-to-end**: Tülu 3, eval harnesses, reward hacking,
  RLHF for safety.

MLE Fundamentals track shares the phase numbering but only includes items
that are MLE-specific (distributed training, GPU systems, eval infra). Track
sizes:
- RLHF: ≥ 40 items.
- MLE Fundamentals: ≥ 8 items.

URL allow-list test must pass.

#### Papers

Every paper has a `summary` of 3–6 sentences in the same opinionated voice
that **cites at least one concrete section / equation / figure / table /
algorithm / appendix / filename** (enforced by `papers.test.ts`) plus 5–7
questions of the form "walk through X" / "explain why Y" — never "what does
X stand for". The reader page renders summary on top, questions below; each
question has a textarea and a Reveal button gated to ≥ 40 chars.

- RLHF papers: ≥ 8.
- MLE Fundamentals papers: ≥ 2 (canonical: ZeRO, FlashAttention).

#### What "polish" means in practice

Autopilot's worker should treat content as a multi-pass effort:

1. **First pass** — every focus note hits the structural minimums above
   (length, section citation, self-check sentence).
2. **Second pass** — read each row aloud. If it sounds like a textbook
   abstract, rewrite it in mentor voice. If the self-check is generic
   ("understand X"), replace it with something testable ("state the policy
   gradient theorem in one breath").
3. **Third pass** — connect adjacent items. The Phase 2 PPO note should
   reference the importance-sampling row from Phase 1 by name. The DPO note
   should reference the closed-form-optimal-policy step from PPO.
4. **Eval pass** — adversarially compare against the canonical source. If
   the focus note misstates a detail (wrong equation number, wrong author
   year, wrong phrase for a method), fix it and add a reference link in the
   prose if it helps.

##### Polish round 2 — explicit punchlist (current state)

The previous polish round shipped, but the bar has been raised. Two new
test gates fail at the moment and are the **explicit current outstanding
work** for autopilot:

- `curriculum.test.ts > every focusNote contains a concrete pointer` —
  fails for ≈ 33 items whose focus notes lack a section / equation /
  figure / table / algorithm / appendix / filename / function-call
  pointer. Each missing item must be polished to add the actual citation
  the reader would open. No template padding ("see §2 of the paper") —
  cite the *load-bearing* section that carries the claim being made in the
  prose.
- `papers.test.ts > every summary cites at least one concrete pointer` —
  fails for ≈ 7 paper summaries (christiano-2017, deepseek-r1, dpo,
  flashattention, lets-verify, rlaif, zero) for the same reason.

Worker workflow: open the failing item, read 3–5 minutes of the canonical
source (paper PDF / book chapter / repo README), pick the **one** section
or equation that carries the load, and rewrite the focus note around it.
Test then passes for that item; commit; repeat.

The eval skill should keep returning polish blockers — and the worker
should keep raising the bar (depth, accuracy, citation density, internal
cross-references) — until every focus note and every paper summary
survives an "is this what a senior RE would say to a junior RE in 90
seconds?" read.

### 5. Visual design

Solarized Light + coral accent. Serif body (current font). Mono accents.
Sidebar 240–260px on desktop; collapses to a fixed bottom-nav on mobile.
The TrackSwitcher is a segmented control (two tabs) immediately under the
product name in the sidebar (or in the mobile top bar).

No sidesheets, no drawers, no modals. Links open in a new tab.

### 6. What to do if content and UI conflict

Always prioritize content. The ugliest button that ships correct prose beats
the prettiest layout that ships a vague abstract.

### 7. Tests

- URL allow-list test on curriculum data.
- Curriculum invariants (length, focus-note length, prerequisite resolution,
  per-phase counts within sane bounds).
- Paper invariants (summary length, ≥ 5 questions per paper, every question
  prompt is "walk through" / "explain why" form, never "what does X stand
  for").
- Storage envelope round-trip + graceful fallback on bad payloads.
- Progress reducer (cycle pending → inprog → done → pending).
- Markdown renderer XSS guard.
- That's enough. No tests for visual styling.

## Definition of done

Hanyu opens the app, picks RLHF, scrolls to Phase 2, reads the PPO row's
focus note, and feels like a senior RE just whispered the secret of the
clipped surrogate in his ear in five sentences. He clicks the Sutton & Barto
Ch 13 row and gets the same feeling. He flips to MLE Fundamentals, opens
ZeRO, reads three sentences and now understands why stage-3 is the only
useful one in modern stacks. The UI never gets in the way. The content was
the whole point.

The judge passes only when every curriculum focus note and every paper
summary clears the polish bar above. The eval skill should keep finding
weakest-link items until none are left — that is what "polish, polish
again" means in this repo.
