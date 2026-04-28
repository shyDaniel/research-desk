# FINAL_GOAL.md — Research Desk

A personal study tool for Hanyu as he transitions from traditional MLE
to a Research Engineer role at a frontier lab. Primary track: Post-training
/ RLHF. Supporting track: MLE fundamentals he hasn't touched in prod
(distributed training, GPU perf, eval infra).

**PRIME DIRECTIVE — in priority order:**

1. **Content depth and accuracy above all else.** Every flashcard answer,
   focus note, and paper question must be the kind of thing a senior RE at
   OpenAI would say out loud, not a textbook summary. This is the only thing
   that matters for Hanyu's goal.
2. **Simplicity of UI.** This is a personal tool for one person. No
   dashboards, no widgets, no streak counters, no "gamification". The
   simpler and more direct the interface, the better. If a feature adds
   complexity without directly helping Hanyu learn, remove it.
3. **It works reliably.** Persistence, navigation, and core interactions
   must be bug-free. That's it.

## User

- Senior ML engineer, passed Meta MLE bar. Strong on inference/serving
  (vLLM, KV cache, quantization). Zero production training experience.
- Joining OpenAI Scaled Abuse team. Goal: transfer to post-training /
  safety research within 12–18 months.
- Uses this app daily, alone, on desktop. No mobile needed.

## Hard Acceptance Criteria

### 1. Tech

- Next.js 15, TypeScript, Tailwind, pnpm. App Router.
- `pnpm install && pnpm build && pnpm start` succeed from clean clone.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass, zero errors.
- No server-side secrets. Deployable to Vercel as-is.

### 2. Persistence

- Progress, flashcard state, paper answers, notes persist in localStorage
  with a versioned key (e.g. `research-desk:v1:*`).
- Export/Import as JSON — two buttons somewhere accessible. That's all.

### 3. UI — four pages, nothing more

The entire app is four pages accessible from a simple top nav or sidebar.
No sub-routes, no modals, no drawers unless genuinely necessary.

**Page 1 — Curriculum**
- List of all items grouped by phase. Each item shows: title, type, time
  estimate, link, and the focus note inline (no click-to-expand needed —
  the focus note is the point, show it).
- Three states: pending / in-progress / done. Click to cycle. Persisted.
- Filter by phase or track (RLHF / MLE-Fundamentals). That's all.
- No sidesheets, no detail drawers. Everything visible on the page.

**Page 2 — Flashcards**
- Show one card at a time. Front is visible. Click or Space to flip.
- After flip: four buttons — Again / Hard / Good / Easy (SM-2 scheduler).
  Keyboard shortcuts 1/2/3/4.
- Show how many cards are due today. When queue is empty, say so.
- No per-card stats drawer. No ease-factor display. Just the card.

**Page 3 — Papers**
- List of papers. Click one to open its page.
- Each paper page: title, year, link, a 3–5 sentence "why this matters"
  note, then the questions listed one by one.
- Each question: the prompt, a textarea to write the answer, a reveal
  button (enabled after 40 chars typed). Answers persist.
- Back button to the list. That's it.

**Page 4 — Notes**
- One big textarea. Markdown rendered below it as you type. Autosaves.
- No multiple named pages. No tabs. Just one persistent scratchpad.

### 4. Content — this is what actually matters

#### Curriculum (≥ 55 items across 5 phases)

Every item must have:
- A real URL (no placeholder domains).
- A time estimate.
- A **focus note** of 2–4 sentences written in the voice of a senior RE
  mentor — not a summary of the paper, but what to pay attention to and
  why it matters for Hanyu specifically. This is the highest-value content
  in the app. Spend the most effort here.

Phase structure (same as before):
- **Phase 1 — Foundations**: S&B Ch 1–13, policy gradient, KL divergence,
  importance sampling, InstructGPT as first applied read, Spinning Up.
- **Phase 2 — PPO & Reward Modeling**: PPO paper + Costa Huang's 37
  details, Christiano 2017, Bradley-Terry RMs, calibration, length bias.
  Project: RM on UltraFeedback + PPO on small LM.
- **Phase 3 — DPO family & CAI**: DPO derivation, IPO, KTO, SimPO,
  Constitutional AI, RLAIF. Project: DPO from scratch vs Phase 2 PPO.
- **Phase 4 — Reasoning RL**: PRMs vs ORMs, DeepSeek-R1 + GRPO,
  rule-based rewards. Project: GRPO on GSM8K.
- **Phase 5 — End-to-end**: Tülu 3, synthetic data, reward hacking,
  RLHF for safety. Capstone: SFT → RM → PPO/DPO on ~1B model, MT-Bench.

MLE-Fundamentals (tagged, mixed into phases):
- Distributed training: FSDP, ZeRO, Megatron 3D parallelism.
- GPU perf: GPU MODE, Triton, FlashAttention, Nsight profiling.
- Eval: lm-evaluation-harness, AlpacaEval, MT-Bench, Arena-Hard.

URL allow-list test must pass (same domains as before).

#### Flashcards (≥ 36 cards)

Every card answer must be a full, confident paragraph — the kind of thing
you'd say in a research interview without notes. Not bullet points, not
one-liners. Required topics (same list as before — forward/reverse KL,
PPO clip, DPO derivation, GRPO, ZeRO stages, FSDP vs DDP, FlashAttention,
reward hacking, GAE, etc.).

If any existing card answer is shorter than 4 sentences or reads like a
Wikipedia intro, rewrite it to be longer and more precise.

#### Papers (≥ 10, same list as before)

Same 10 papers. Each with:
- A "why this matters for you specifically" editorial note (3–5 sentences,
  written to Hanyu, not generic).
- 5–7 questions that test genuine understanding of the load-bearing
  mechanics, not surface recall. Bad question: "What does DPO stand for?"
  Good question: "Walk through where the partition function cancels in the
  DPO derivation."

### 5. Visual design

Keep the Solarized Light + Claude coral palette that's already in the app.
Do not redesign from scratch — just simplify the layout.

The simplification mandate:
- **Remove the Dashboard tab entirely.** Replace it with nothing. The
  curriculum page IS the home page.
- **Remove the streak widget, weekly progress bars, phase overview cards,
  continue CTA** — all of it. Replace with: a single line of text at the
  top of the curriculum page showing "X of 55 done" and "Y cards due today".
  That is the entire dashboard.
- **No sidesheets or drawers** anywhere. Everything inline.
- **No modal overlays.** Links open in a new tab. Paper detail is just a
  route, not a modal.
- **Navigation**: four items in a minimal top bar or left sidebar. Active
  page highlighted. Nothing else in the nav.

Typography, colors, spacing — keep what's already there. Do not touch the
palette, do not switch fonts. Only simplify structure.

### 6. What to do if content and UI conflict

Always prioritize content. If fixing a content gap means the UI is slightly
less polished, that is the right tradeoff. The user will forgive an ugly
button but will not forgive a wrong flashcard answer.

### 7. Tests

- SM-2 scheduler unit tests.
- URL allow-list test on curriculum data.
- localStorage persistence smoke test.
- That's enough. Do not add tests for UI components or visual things.

## Definition of done

Hanyu sits down, opens the app, reads the focus note on Sutton & Barto Ch 13,
flips through 10 flashcard cards, reads the InstructGPT paper questions,
writes his answers, and closes the laptop — and tomorrow he is meaningfully
better prepared for a research engineer role than he was today. The UI never
got in the way. The content was the whole point.
