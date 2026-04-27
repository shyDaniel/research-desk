# FINAL_GOAL.md — Research Desk

A production-grade, statically-hosted web app that is Hanyu's personal
"learning OS" for transitioning from traditional MLE (Meta MLE-bar level) to a
Research Engineer role at a frontier lab (OpenAI / Anthropic). The primary
track is **Post-training / RLHF**. A supporting track covers **MLE fundamentals**
he is under-exposed to (distributed training, GPU performance, eval infra).

This is not a toy. The content is the product — links, summaries, focus notes,
flashcard answers, and paper questions must all be technically precise enough
that a senior researcher would not scoff. The aesthetic is "research desk":
dark, editorial, serif headings, monospace for identifiers, one sharp accent.
Think quantitative-trading platform meets arXiv.

## User

- Already a senior ML engineer (passed Meta MLE bar, strong inference/serving
  background: vLLM, KV cache, continuous batching, quantization).
- Gaps: training-side distributed systems (FSDP/ZeRO/Megatron), GPU kernel
  work (Triton/CUDA), RL fundamentals, full post-training pipelines.
- Starting OpenAI Scaled Abuse team; plans to transfer to post-training
  (Safety Systems / Preparedness / Model Behavior / post-training group)
  within 12–18 months.

## Hard Acceptance Criteria

All must be TRUE before the judge is allowed to return `done: true`.

### 1. Tech & build

- [ ] Next.js 15 app with TypeScript, Tailwind, pnpm. App Router.
- [ ] `pnpm install && pnpm build && pnpm start` all succeed from a clean clone.
- [ ] `pnpm lint` and `pnpm typecheck` pass with zero warnings/errors.
- [ ] `pnpm test` passes (Vitest + React Testing Library). At minimum: tests
      for the flashcard SM-2 scheduler, the progress store reducer, and the
      curriculum filter.
- [ ] Deployable to Vercel / static hosting. No server-side secrets required.
- [ ] Lighthouse on `/` in production build: ≥ 95 performance, ≥ 95 a11y,
      ≥ 95 best practices, ≥ 95 SEO (report committed to `lighthouse.json`).

### 2. Persistence

- [ ] Progress, flashcard scheduler state, paper-question answers, and notes
      all persist across browser sessions using `localStorage` with a
      versioned schema (e.g. `research-desk:v1:progress`).
- [ ] Export/Import JSON: user can download full state and re-upload it. The
      UI has visible buttons for both.
- [ ] Schema migrations: if a future schema version is encountered, the app
      must not crash — it either migrates or falls back gracefully.

### 3. Sections (tabs)

1. **Dashboard**
   - Current phase card (phase name, 1-line description, progress bar).
   - "Continue" block — the most recently touched curriculum item with a
     one-click jump.
   - Next 3–5 upcoming items in the current phase.
   - Due flashcards count (today) with a CTA.
   - Per-phase progress bars for all phases.
   - Weekly streak indicator (days with ≥ 1 item marked done or ≥ 5 cards
     reviewed).

2. **Curriculum**
   - ≥ 55 items organized by 5 phases. Each item has:
     - Title
     - Type (Paper / Book chapter / Blog post / Video / Code project / Tutorial)
     - Source link (real URL, never `example.com`; see "Content standards")
     - Time estimate (hours or "X pages")
     - **Focus note** — 1–3 sentences telling Hanyu what to actually pay
       attention to, written as if by a Research Engineer mentor, not a
       content-farm summarizer.
     - Track tag: `RLHF` (primary) or `MLE-Fundamentals` (supporting).
     - Prerequisites (list of prior item IDs).
   - Filters: by phase, by track, by type, by completion state.
   - Checkboxes; clicking advances state (pending → in-progress → done),
     persisted.
   - Clicking a row opens a side-sheet with the focus note, the link, and a
     free-text **notes** textarea (per-item, persisted).

3. **Flashcards**
   - ≥ 30 cards covering load-bearing RLHF + MLE-fundamentals concepts
     (list in "Content standards" below).
   - SM-2 spaced-repetition scheduler (Again / Hard / Good / Easy buttons).
   - Today's due queue is shown first, empty-state when drained.
   - Flip animation; keyboard shortcuts (Space = flip, 1/2/3/4 = grade).
   - "Due" count shown in the sidebar badge.
   - Per-card stats: ease factor, interval, reps (visible in a details
     drawer).

4. **Papers**
   - ≥ 10 canonical papers with per-paper pages containing:
     - Authors, year, venue, canonical URL (arXiv or conference).
     - A 3–5 sentence editorial summary explaining *why this paper matters*
       for Hanyu's goal (not the paper's own abstract).
     - 5–7 pointed comprehension questions that test understanding of
       load-bearing details, not trivia (examples in "Content standards").
     - A per-question answer textarea; answers persist.
     - A "Reveal my answer" button that is only enabled after the user
       types ≥ 40 characters (prevents passive reading).
   - No LLM grading. User is trusted to self-grade. (Static-first by design.)

5. **Notes** (global)
   - Free-form markdown notebook. Supports ≥ 3 named pages. Autosaves.
   - Rendered markdown preview side-by-side on desktop; tabbed on mobile.

### 4. Content standards — MUST be correct, not generic

#### Curriculum phases (exact structure required)

- **Phase 1 — Foundations** (~8–12 items)
  RL fundamentals (Sutton & Barto Ch 1–13), policy-gradient theorem,
  KL divergence deep-dive, importance sampling, variance reduction.
  InstructGPT as the first "applied RLHF" read. Spinning Up in Deep RL.
- **Phase 2 — PPO & Reward Modeling** (~10–14 items)
  PPO paper + Costa Huang's 37 implementation details + clipped surrogate
  objective. Christiano et al. 2017 (original preference RL). Bradley-Terry
  RMs, calibration, length bias. Project: reward model on UltraFeedback
  subset + PPO on a small LM.
- **Phase 3 — DPO family & Constitutional AI** (~10 items)
  DPO derivation, IPO, KTO, SimPO. Constitutional AI, RLAIF, self-rewarding
  language models. Project: DPO from scratch and compare to Phase 2 PPO.
- **Phase 4 — Reasoning RL** (~10 items)
  "Let's Verify Step by Step" (PRMs vs ORMs), DeepSeek-R1 + GRPO,
  rule-based verifiable rewards. Project: GRPO on GSM8K.
- **Phase 5 — Specialization & end-to-end** (~8–12 items)
  Tülu 3 recipe, synthetic data pipelines, RLHF for safety, reward hacking.
  Capstone: full SFT → RM → PPO/DPO pipeline on a ~1B model, evaluated on
  MT-Bench.

In parallel, tagged `MLE-Fundamentals`:

- Distributed training: FSDP tutorial, ZeRO paper, Megatron-LM, 3D
  parallelism.
- GPU performance: GPU MODE lectures, Triton tutorials, FlashAttention v1+v2,
  profiling with Nsight.
- Eval infra: lm-evaluation-harness, AlpacaEval (length-controlled),
  MT-Bench, Arena-Hard. Reward-hacking / spec-gaming literature.

#### Link quality rules (enforced by a test)

- Every curriculum item's `url` must be a real, reachable domain. Forbidden:
  `example.com`, `lorem`, `TODO`, empty string, `#`.
- A unit test parses `src/data/curriculum.ts`, asserts every URL matches
  `^https?://` and that the host is on an allow-list of real domains
  (`arxiv.org`, `openai.com`, `anthropic.com`, `deepmind.google`,
  `huggingface.co`, `github.com`, `youtube.com`, `gpumode.com`,
  `distill.pub`, `www.deeplearningbook.org`, `incompleteideas.net`,
  `spinningup.openai.com`, `rlhfbook.com`, `allenai.org`, `ai2.allenai.org`,
  `jmlr.org`, `proceedings.neurips.cc`, `openreview.net`, `pytorch.org`,
  `nvidia.com`, `triton-lang.org`, `icml.cc`, `eleuther.ai`,
  `lmsys.org`, `iclr.cc`, `neurips.cc`, `aclanthology.org`,
  `arxiv-vanity.com`, `microsoft.com`, `research.google`,
  `meta.com`, `ai.meta.com`, `wandb.ai`, `nathanlambert.com`,
  `interconnects.ai`). Extend the allow-list only with real, authoritative
  sources.

#### Flashcard coverage (≥ 30 cards, must include all of these topics)

- Forward vs reverse KL (and which one RLHF penalizes, why).
- PPO clipped surrogate objective — state it from memory, including clip
  range intuition.
- Why PPO needs a value function and DPO doesn't.
- Bradley-Terry preference model + log-likelihood form.
- KL penalty to reference policy — purpose and failure mode if removed.
- DPO loss derivation sketch: from RLHF objective → closed-form optimal
  policy → preference likelihood → partition function cancels.
- GRPO advantage formula (group mean/std baseline, no value network).
- Process RM vs Outcome RM — when each is appropriate.
- ZeRO stages 1/2/3 — what is sharded at each stage.
- FSDP vs DDP — param/grad/optimizer behavior.
- Activation checkpointing — memory/compute tradeoff.
- bf16 vs fp16 — range vs precision, why bf16 usually wins for training.
- KV cache memory formula.
- Continuous batching (vLLM) — the key insight.
- FlashAttention — online softmax + tiling, IO-bound → compute-bound.
- Speculative decoding — draft/verify mechanics.
- Reward hacking — definition + 3 mitigations.
- Length bias in RMs — cause + at least 2 mitigations.
- Constitutional AI — SL-CAI + RL-CAI two-stage recipe.
- GAE — bias/variance tradeoff via λ.
- Importance sampling in off-policy RL.
- Why RLHF improves over SFT even when SFT covers the same distribution.
- Frozen reference model — why freezing matters.
- Reward model calibration — definition + how to check it.
- Tülu 3 recipe — the three stages.

Answers must be technically precise, the length of a confident paragraph,
and not read like marketing copy.

#### Papers (≥ 10 required)

1. InstructGPT (Ouyang et al. 2022)
2. PPO (Schulman et al. 2017)
3. Christiano et al. 2017 (original preference RL paper)
4. DPO (Rafailov et al. 2023)
5. Constitutional AI (Bai et al. 2022)
6. DeepSeek-R1 (2025) + the GRPO / DeepSeekMath paper
7. "Let's Verify Step by Step" (Lightman et al. 2023)
8. ZeRO (Rajbhandari et al. 2019)
9. FlashAttention (Dao et al. 2022) + FlashAttention-2
10. RLAIF (Lee et al. 2023)

Each paper gets 5–7 pointed questions. Sample quality bar — InstructGPT:
"What alignment tax did they observe and on which benchmarks?",
"Why initialize the value function from the RM rather than the SFT model?",
"How did they collect comparison data and what were its known biases?".
NOT acceptable: "What is the paper about?", "Summarize the abstract".

### 5. Aesthetic

- Dark editorial theme. Near-black warm-toned background (`#0f0e0c`-ish),
  cream text (`#f1ece0`-ish), one sharp accent (deep red OR amber — not both).
- Serif display font (Fraunces or Newsreader) for headings.
- Clean sans (Geist / Plus Jakarta / IBM Plex Sans) for body.
- Mono (JetBrains Mono / Geist Mono) for identifiers, code, keyboard shortcuts.
- Subtle grain/noise texture on background surfaces (SVG or CSS, not a PNG).
- No purple, no generic "chatbot dark mode". No emoji in UI chrome.
- Animations minimal and purposeful — card flips, progress bar fills. No
  parallax, no gratuitous fades.
- Responsive: works at 375px width (iPhone SE) and at 1440px desktop.
  Sidebar collapses to a bottom-nav on mobile.

### 6. Accessibility

- All interactive elements reachable by keyboard.
- Visible focus rings (not `outline: none`).
- Color contrast meets WCAG AA on all text.
- Flashcard grading buttons have both keyboard shortcuts and ARIA labels.

### 7. Docs & repo hygiene

- `README.md` with screenshot, tech stack, setup, deploy instructions.
- `ARCHITECTURE.md` describing the data model (curriculum / cards / papers),
  persistence, and how to add content.
- `WORKLOG.md` appended each iteration by autopilot.
- Everything commits cleanly and pushes.

## Non-goals

- No accounts / auth / multi-user.
- No backend, no LLM calls. Everything runs from static files + localStorage.
- No mobile native app.
- No content outside the two tracks above (no general CS curriculum).

## Definition of done (single sentence)

Hanyu can clone the repo, run `pnpm install && pnpm build && pnpm start`,
open the app, and use it every day for 12 months as his primary study tool
without hitting a bug, a broken link, a fuzzy flashcard answer, or a UI
regression — and a Research Engineer at OpenAI looking over his shoulder
would not wince at any piece of content.
