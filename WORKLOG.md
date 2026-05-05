# WORKLOG.md — Research Desk

Append-only log of autopilot iterations. Each entry: date, subtask id,
what changed, what was actually observed when exercising the product.

## 2026-05-05 · S-024 · Rewrite README to describe the real product

Replaced the stale README that still led with "README is stale
post-refactor" and marketed the deleted Dashboard / Flashcards (SM-2)
/ multi-page Notes / Export-Import surfaces. The new README describes
what actually ships: two pages (Curriculum, Papers), two tracks
(RLHF n=44, MLE Fundamentals n=11), routes
`/[track]/{curriculum,papers,papers/[slug]}` with `/` redirecting to
`/rlhf/curriculum`, three localStorage v1 slots
(`progress`, `paper-answers`, `item-notes`), port 4747, real test
count 69, real paper split (9 RLHF + 2 MLE = 11), Solarized-Light +
coral aesthetic, and the "no auth, no backend, no LLM at runtime"
non-goals. The "What lives where" section now points at the real
file layout (`app/[track]/...`, `src/lib/track.ts`,
`src/lib/progress.ts`, `src/lib/storage.ts`, `src/lib/markdown.tsx`,
`src/data/{curriculum,papers,types}.ts` and the `__tests__` dirs)
instead of the deleted `src/lib/sm2.ts` / `src/lib/streak.ts` /
`(tabs)` route group.

Acceptance grep clean:
`grep -iE 'flashcard|sm-?2|notes tab|dashboard|export|import|five tabs|five phases|149|stale post-refactor' README.md`
returns 0. `pnpm lint` clean, `pnpm typecheck` clean, `pnpm test`
69/69 green.

## 2026-05-05 · S-017 · Stop lowercasing acronyms (RL, GPU) in curriculum H1

`app/[track]/curriculum/page.tsx:37` was rendering
`{meta.tagline.toLowerCase().replace(/\.$/, "")}.` so the H1 read
"44 items, post-training, preference optimization, reasoning rl." and
"11 items, distributed training and gpu systems you must know." The
nuke-the-whole-string `.toLowerCase()` call was the bug: it lowercased
the first character of the tagline (which is what the prose flow
wants — "N items, post-training…") AND every internal acronym. Swapped
to `meta.tagline.charAt(0).toLowerCase() + meta.tagline.slice(1)`,
which only down-cases the leading letter and renders the rest of the
string verbatim from `TRACK_META`. The trailing period now comes from
the tagline itself instead of being re-appended in JSX, so there's no
double-period either.

Verified live by curl against `pnpm start` on :4747:
- `/rlhf/curriculum` H1: `'44 items, post-training, preference optimization, reasoning RL.'`
- `/mle/curriculum`  H1: `'11 items, distributed training and GPU systems you must know.'`
- `grep -c 'reasoning RL\.' rlhf.html` → 1
- `grep -c 'GPU systems'    mle.html`  → 1

Added `src/lib/__tests__/track.test.ts` (6 tests) — asserts the
TRACK_META taglines literally contain "RL" and "GPU" (and lack
the lowercase forms), and round-trips parseTrackSlug /
slugToTrack / trackToSlug. This is a data-layer regression guard:
even if some future page renderer reaches for `.toLowerCase()`
again, the data contract makes the intended casing explicit.

`pnpm lint` clean, `pnpm typecheck` clean, `pnpm test` 69/69
green (was 63, +6 from the new track test file), `pnpm build`
green.

## 2026-05-04 · S-010 · Paper question form — kill the two "What does …" violators

Rewrote the two paper prompts that started "What does …" — the shape
FINAL_GOAL §4 explicitly forbids ("never 'what does X stand for'") and
§7 replaces with imperatives.
- `dpo/beta-role`: "What does the DPO β hyperparameter control
  geometrically? How does it correspond to the KL coefficient in PPO,
  and what happens as β→0 and β→∞?" → "Explain how the DPO β
  hyperparameter controls the geometry of the implicit reward and
  connect it to the KL coefficient in PPO; describe what happens as
  β→0 and β→∞." (load-bearing detail unchanged: β's geometric role +
  PPO-KL correspondence + the two limit cases.)
- `zero/zero-stages`: "What does ZeRO-1, ZeRO-2, and ZeRO-3 each shard
  across data-parallel workers? Give the memory multiplier vs plain
  DDP at each stage." → "Walk through what each of ZeRO-1, ZeRO-2,
  and ZeRO-3 shards across data-parallel workers, and give the
  per-stage memory multiplier vs plain DDP." (same load-bearing
  detail: per-stage shard target + memory multiplier vs DDP.)

Added a Vitest regression guard in `src/data/__tests__/papers.test.ts`
that asserts (1) no prompt opens with `/^\s*what\s+does\b/i` and
(2) no prompt anywhere contains the `\bstand(s)?\s+for\b` idiom.
Mid-prompt "what does this imply / tell you / buy you" follow-up
clauses are deliberately not caught — those are colloquial framings
of consequence questions, not the acronym-definition trivia §4
forbids.

Observed: `grep -ciE '^\s*"what does' src/data/papers.ts` → 0
(was 2). `pnpm test` → 63/63 passing in 578 ms (was 62, +1 for the
new prompt-shape guard). `pnpm lint --max-warnings=0` clean,
`pnpm typecheck` clean, `pnpm build` clean — `/[track]/papers/[slug]`
route unchanged at 2.65 kB / 112 kB first-load, 11 paper pages still
prerendered, both rewritten prompts visible at
`/rlhf/papers/dpo` and `/mle/papers/zero` via the existing
`paper-reader.tsx` render path.

## 2026-05-04 · S-001 · Curriculum focus notes — Self-check tails on all 55

Appended a one-sentence "Self-check: …" retrieval question to every entry
in `src/data/curriculum.ts`, as FINAL_GOAL.md §4 mandates. Each Self-check
is concrete and item-keyed (e.g. p1-sutton-barto-pg → "state the policy-
gradient theorem with a state-dependent baseline in one breath"; p2-ppo-
paper → write L^CLIP and explain the KL-penalty preference; p4-deepseekmath-
grpo → write the group-relative advantage formula and quantify the GPU
savings). No "understand X" generics. The two notes that were under the
§4 200-char floor (p2-rm-calibration 199, p3-rlaif-paper 184) cleared it
naturally as the Self-check sentences arrived. Raised the curriculum
Vitest invariant from `≥ 40 chars` to `≥ 200 chars` and added a separate
assertion that every focusNote ends with `Self-check: <≥25-char question>`.
Updated the file-header invariant comment block to match.

Observed: `pnpm lint` clean, `pnpm typecheck` clean, `pnpm test` 62/62
passing (was 61, +1 for the new Self-check assertion), `pnpm build`
green (16.3 kB curriculum route, 122 kB first-load JS). Started
`pnpm start` on :4747 and `curl /rlhf/curriculum | grep Self-check`
returns the rendered Self-check sentences inline on the page (HTTP 200).

## 2026-04-27 · S-001 · Bootstrap scaffold

Scaffolded a clean Next.js 15 App Router + TypeScript strict + Tailwind v3
project at the repo root with pnpm. Fonts (Fraunces serif, Geist Sans, Geist
Mono) wired via `next/font/google` as CSS variables. Dark editorial base
theme lives in `app/globals.css` (warm near-black `#0f0e0c` background,
cream `#f1ece0` text, amber `#e59a25` accent, SVG turbulence grain). Landing
page at `app/page.tsx` renders a serif display headline, an amber "Enter
the desk" CTA, and a three-panel Track A / Track B / Mode info grid. Added
`app/icon.svg` favicon. Committed `.mcp.json` wiring playwright +
chrome-devtools so future judge iterations can drive the real browser.

Observed via Playwright MCP at `http://localhost:3100/`: HTTP 200, 14 KB
HTML, page title "Research Desk". Mobile screenshot (375×667): headline
wraps narrowly across four lines, CTA and info panels stack in a single
column, no horizontal scroll. Desktop screenshot (1168 wide): headline
reads "A quiet desk for / *becoming a* / research engineer." with Fraunces
italic middle line, panels in a three-column editorial grid, hairline
dividers visible, amber accent clearly present on the bullet, the eyebrow
"PERSONAL LEARNING OS" label, and the CTA. No purple, no emoji chrome, no
placeholder text.

Quality gates: `pnpm build` succeeds (3.74 kB route, 109 kB first-load JS),
`pnpm typecheck` clean, `pnpm lint --max-warnings=0` clean, `pnpm start`
on `:3100` serves `/` and `/icon.svg` with HTTP 200. Remaining items from
FINAL_GOAL.md (persistence layer, Dashboard/Curriculum/Flashcards/Papers/
Notes tabs, content authoring, Vitest tests, Lighthouse report) land in
subsequent iterations.

## 2026-04-27 · S-016 · Solarized Light + Claude coral theme

Ripped out the dark editorial theme (warm near-black `bg-ink-950` + amber
`#e59a25` on `text-bone-100`) and replaced it with the palette FINAL_GOAL.md
§5 actually mandates. `tailwind.config.ts` now exposes `solar-50..900`
(Solarized base3 → base03 neutral ramp, `#FDF6E3` → `#002B36`), `coral-50..800`
(Claude coral, `#D97757` at 500), and `sol.{blue,green,orange,…}` for
semantic accents; the old `ink/bone/amber/rust` namespaces are gone.
`app/globals.css` re-authors every CSS custom property (`--bg #FDF6E3`,
`--fg #586E75`, `--accent #D97757`, `--mono-ident #268BD2`, `--success
#859900`), adds a Solarized-blue inline-code rule, and drops the SVG grain
that only read well on dark. `app/layout.tsx` flips `colorScheme` to
`light`, `themeColor` to `#FDF6E3`, and the body to `bg-solar-50
text-solar-700`. `app/page.tsx` is retokenized end-to-end: coral bullet,
coral eyebrow, coral filled CTA with cream label (not a ghost button),
slate `text-solar-700` headline with italic `text-solar-800` middle line,
parchment dividers, `bg-solar-100` panels with `border-solar-200` gutters.
`app/icon.svg` flipped to cream ground + coral dot + slate underline.

Observed via Playwright against the production `pnpm start` on `:3100`:
computed styles on `/` report `body { background: rgb(253, 246, 227); color:
rgb(88, 110, 117) }` (= `#FDF6E3` / `#586E75`), the CTA reports `{ bg:
rgb(217, 119, 87), color: rgb(253, 246, 227), border: rgb(217, 119, 87) }`
(= Claude coral `#D97757` on cream), and the H1 resolves to the Fraunces
family at `#586E75`. Full-page desktop screenshot at 1440×900 shows the
three-column Track A / Track B / Mode grid on warm parchment with slate
serif headings, the coral "Enter the desk" button reads as the dominant
call-to-action against the cream, no harsh black edges. Mobile 375×812
screenshot shows panels stacking full-width with the same palette — no
horizontal scroll, serif scales down gracefully. Grep across `app/**/*.{
tsx,css,svg}` returns zero occurrences of `bg-ink-*`, `text-bone-100`,
`bg-amber-*`, or `border-ink-*`; the only `ink`/`bone`/`amber` string left
in the repo is in `WORKLOG.md` itself, describing the removal.

Note on MCP usage: Playwright MCP's system Chrome launch is blocked on this
machine by `DevTools remote debugging is disallowed by the system admin`,
so I drove the bundled Playwright-chromium directly via a one-off `node`
script (then deleted the script after capturing evidence). Screenshots
archived under `/tmp/research-desk-shots/{desktop-1440,mobile-375}.png`.
`pnpm build` / `lint` / `typecheck` all clean; the production route is
still 3.74 kB / 109 kB first-load. Dashboard, curriculum, flashcards,
papers, notes, persistence, SM-2, tests, Lighthouse remain outstanding for
later iterations — this subtask was strictly the palette rewrite.

## 2026-04-27 · S-030 · Curriculum data module + URL allow-list test

Authored `src/data/types.ts` (CurriculumItem interface + 36-host
HOST_ALLOWLIST) and `src/data/curriculum.ts` (55 typed items in suggested
reading order). Phase distribution: P1=11 foundations (Sutton & Barto,
Spinning Up, InstructGPT, KL/importance sampling, nanoGPT), P2=13 PPO &
reward modeling (PPO paper, GAE, Costa Huang's 37 details, Christiano'17,
UltraFeedback, length bias, trlx/TRL, Secrets I+II, end-to-end project),
P3=10 DPO family + CAI (DPO, IPO, KTO, SimPO, DPO-vs-PPO, CAI, RLAIF,
self-rewarding, DPO project, Lambert's RM-still-matters post), P4=9
reasoning RL (Let's Verify, Math-Shepherd, DeepSeekMath/GRPO, R1, OpenAI
RBR, Open-R1, VeRL, GRPO-on-GSM8K project, PRM-vs-ORM), P5=12 end-to-end +
MLE infra (Tülu 3, ZeRO, FSDP, FlashAttention v1+v2, Triton, GPU MODE,
Megatron, reward-hacking survey, lm-eval-harness, AlpacaEval-LC, capstone).
Every focusNote is a paragraph of mentor-voice direction ("derive §4 line
by line", "if your KL flatlines at 0 the value function is broken — debug
before tuning"), not blurb-style summary.

Added `src/data/__tests__/curriculum.test.ts` (12 tests) + `vitest.config.ts`
(node env, `@/*` → `src/*` alias). Tests assert: ≥55 items, unique ids,
every URL matches `^https?://` with host ∈ HOST_ALLOWLIST, focusNote
≥40 chars & no placeholder tokens, non-empty title/timeEstimate, every
prerequisite id resolves, no cycles in the prereq DAG, phase counts
within FINAL_GOAL §4 ranges (P1 8–12, P2 10–14, P3 8–11, P4 8–11, P5 8–12),
and at least one RLHF item per phase. `pnpm test` → 12 passed in 230ms.

Empirical link check: `curl -I -L` against all 49 unique URLs in
`src/data/curriculum.ts` returned HTTP 200 for every one (arxiv × 28,
github × 6, spinning-up × 3, incompleteideas × 3, interconnects × 2,
youtube × 2, plus pytorch/triton/huggingface/rlhfbook/deeplearningbook/
iclr-blog-track). Three URLs were caught and replaced during verification:
the made-up `huggingface.co/blog/Costa-Huang/ppo-implementation-details`
→ the canonical `the_n_implementation_details_of_rlhf_with_ppo`; the
404 `www.anthropic.com/research/rule-based-rewards` → `arxiv.org/abs/
2411.01111` (retitled to credit Mu et al. — the RBR paper is OpenAI's,
not Anthropic's, which the prior title got wrong); and the 404
`interconnects.ai/.../why-reward-models-still-matter` → `.../why-reward-
models-matter`. `pnpm build` / `pnpm lint --max-warnings=0` / `pnpm
typecheck` all clean. Curriculum tab still has no UI to render this data
in — that's the next subtask.

## 2026-04-27 · S-058 · Primary CTA wired, (tabs) route group shipped

Fixed the `app/page.tsx` "Enter the desk" CTA which was linking back to `/`
and reloading the landing. New `href="/dashboard"`. Built the App Router
`(tabs)` route group: `app/(tabs)/layout.tsx` renders a persistent 248px
sidebar (cream `bg-solar-100/60`, parchment border, coral dot wordmark, five
tab entries with active "NOW" chip) plus a mobile-only bottom nav (DESK ·
CURR · CARDS · PAPERS). The nav logic lives in
`app/(tabs)/_components/sidebar-nav.tsx` (client component, uses
`usePathname` + `startsWith` for active state; `aria-current="page"` set on
the live tab; variants for side vs bottom). Dashboard stub at
`app/(tabs)/dashboard/page.tsx` is honest: it pulls `CURRICULUM` from
`src/data/curriculum.ts`, renders 5 phase cards with per-phase counts (P1=11,
P2=13, P3=10, P4=9, P5=12) and an "OPENS WITH" pointer at the first real
item (Sutton & Barto, PPO paper, DPO, Let's Verify, Tülu 3). A status card
explains which surface is online and which are still being authored — no
empty rectangles. Curriculum / Flashcards / Papers / Notes render `TabStub`
components describing what shipping-next looks like (phase grouping +
filters, SM-2 + Space/1–4 shortcuts, 10 canonical papers with reveal-gated
answers, ≥3 markdown pages with autosave), each with a "Back to dashboard"
pill so no tab is a dead end. Also killed the self-defeating `next:
dashboard · curriculum · flashcards · papers · notes` narration on the
landing; replaced with a secondary `Browse the curriculum →` link that
actually goes somewhere. `.mcp.json` now passes `--browser chromium
--headless` to `@playwright/mcp` so future iterations don't trip over the
system-Chrome remote-debug block.

Observed via Playwright (bundled chromium, headless, 1440×900 then 375×812):
`GET /` → 200, CTA's `href` attribute reads `/dashboard` (asserted); clicking
it triggers `waitForURL("**/dashboard")` which resolves in <10s; the landed
page's `h1` reads "The desk, today.", and `nav[aria-label='Primary']` exposes
five tabs exactly — Dashboard (with "now" chip appended), Curriculum,
Flashcards, Papers, Notes. Clicking the sidebar Curriculum link lands at
`/curriculum` with `h1` "55 items, five phases, one path." and
`aria-current="page"` correctly attached to the Curriculum `<a>` (verified
via raw HTML). Mobile 375px screenshot shows the desktop sidebar hidden, a
compact top bar, and the fixed bottom nav visible
(`nav[aria-label='Mobile primary']`). Body computed style on the dashboard
is `{ background: rgb(253, 246, 227), color: rgb(88, 110, 117) }` — cream
`#FDF6E3` / slate `#586E75`, theme tokens intact. Screenshots archived under
`/tmp/research-desk-shots/s058/{01-landing,02-dashboard,03-curriculum,04-dashboard-mobile}.png`.

Quality gates: `pnpm lint --max-warnings=0` clean, `pnpm typecheck` clean,
`pnpm test` → 12/12 passing in 233ms, `pnpm build` succeeds with 6 static
routes (`/`, `/dashboard`, `/curriculum`, `/flashcards`, `/papers`,
`/notes`), all prerendered, each at ~188 B / 109 kB first-load. Still
outstanding for later iterations: the localStorage `research-desk:v1:*`
persistence layer, SM-2 scheduler + its Vitest, ≥30 flashcards data, ≥10
papers data, real Curriculum / Flashcards / Papers / Notes UIs,
export/import JSON, streak tracking, Lighthouse report, README screenshot.

## 2026-04-27 · S-074 · Curriculum tab — real list UI, filters, progress, notes side-sheet

Replaced the `/curriculum` TabStub with the full authored UI. New modules:
`src/lib/storage.ts` (versioned `{version,data}` envelope wrapper over
localStorage — reads null-on-missing, falls back gracefully on unreadable
and future-version payloads, composes forward migrations),
`src/lib/progress.ts` (pure reducer — `cycleProgress` advances pending →
inprog → done → pending and removes the entry on wrap to keep the
persisted blob tight; `summarize` for dashboards),
`src/state/use-progress.ts` (thin React hook that hydrates once on mount
and writes through to `research-desk:v1:progress`),
`src/state/use-item-notes.ts` (same shape, 250ms debounced writes to
`research-desk:v1:item-notes`),
`src/components/curriculum-filters.tsx` (chip-style filter bar, four
dimensions — phase/track/type/state — plus an exported pure
`applyFilters`), `src/components/curriculum-list.tsx` (phase-grouped `<ul>`
of `<article>` rows with tristate checkbox icon — dotted parchment for
pending, coral ▣ for inprog, Solarized green ✓ for done — line-through
title on done, secondary `· notes` chip if the side-sheet has any
persisted text), and `src/components/curriculum-detail-sheet.tsx`
(right-hand `role=dialog` sheet: Phase/Track/Type chip, serif title, `id`
in Solarized blue, focus note, canonical link with `rel="noreferrer"`,
prerequisites as mono chips, autosaving notes textarea, state pill,
cycle CTA whose label adapts to the next state). The Curriculum page is
now `"use client"`, wires all of the above, and shows a 4-stat header
(`55 TOTAL  N DONE  N IN PROGRESS  N PENDING`). Added Vitest suites for
both new libs: 10 storage tests (round-trip, unparseable JSON, missing
fields, future version, migration composition, migration-throws, null,
bad type) and 14 progress-reducer tests (cycle semantics including the
done → removed-from-map invariant, `setProgress`, `getProgress`,
`summarize`). ARCHITECTURE.md updated with the new `item-notes` key.

Observed via bundled playwright (system-Chrome remote-debug is still
blocked by the admin policy, as in prior iterations) driving
`pnpm exec next start -p 3100` at 1440×900 then 375×812:
`rows rendered: 55`; clicking the first row's checkbox once flips
`data-state` from `pending` → `inprog`; clicking again → `done`;
`page.reload()` → first-row `data-state` still `done` (progress persisted
to `research-desk:v1:progress`); clicking the row title opens the
side-sheet whose `#detail-title` reads "Reinforcement Learning: An
Introduction (Sutton & Barto) — Ch 1–6" and whose
`[data-testid=detail-url]` href is
`http://incompleteideas.net/book/RLbook2020.pdf`; typing `test` into
`[data-testid=detail-notes]`, reloading, and re-opening the sheet returns
`inputValue() === "test"` (notes persisted to
`research-desk:v1:item-notes`); clicking `track=RLHF` in the filter bar
drops the visible row count from 55 → 44; clicking `phase=P3` drops it to
10 (exactly the P3 item count). Desktop screenshot shows all five phase
sections with coral phase eyebrows, Fraunces serif subtitles, per-phase
`n/total done` counter, a cream filter panel with coral active chips.
Mobile screenshot at 375×812 shows the top bar, full-width stacked rows,
filters wrapping to multiple chip lines, no horizontal scroll. Side-sheet
screenshot shows Phase 1 · RLHF · BOOK CHAPTER chip, the full focus-note
paragraph, the coral underlined canonical URL, the autosaving notes
textarea, the `DONE` state pill in Solarized green, and a coral `RESET`
footer CTA (from `done` the next cycle resets to `pending`). Screenshots
archived under `/tmp/research-desk-shots/s074/{01..09}.png`.

Quality gates: `pnpm build` succeeds (curriculum route: 14.7 kB / 120 kB
first-load, up from the 183 B stub — every other route unchanged),
`pnpm lint --max-warnings=0` clean, `pnpm typecheck` clean, `pnpm test`
→ 36/36 passing in 263ms (10 storage + 14 progress + 12 curriculum data).
Still outstanding for later iterations: SM-2 scheduler module + tests,
≥30 flashcards data module, ≥10 papers data module + per-paper pages with
reveal-gated answers, markdown notebook, export/import JSON UI, streak
tracker, real dashboard widgets (current-phase / Continue / due count),
Lighthouse report, README screenshot.

## 2026-04-27 · S-086 · Flashcards tab — SM-2 scheduler, 36 cards, flip UI

Replaced the `/flashcards` TabStub with the real surface. New modules:
`src/lib/sm2.ts` (pure SM-2: `Grade` = again/hard/good/easy, `SM2State`,
`MIN_EASE=1.3`, `DEFAULT_EASE=2.5`, `initialState`, `grade`,
`nextIntervalDays`, `isDue`, `partitionDeck`, `dueCount`. Anki-style q
mapping: again→q2 (10-min relearn, reps reset, lapses++), hard→q3
(interval×1.2 after first rep), good→q4 ({1d,6d,interval×ease}), easy→q5
({4d,7d,interval×ease×1.3}). EF drift EF+(0.1−(5−q)(0.08+0.02(5−q)))
clamped at 1.3). `src/data/flashcards.ts` (36 cards covering every
FINAL_GOAL §4 topic: forward/reverse KL, PPO clipped surrogate, PPO vs
DPO value fn, Bradley-Terry, KL penalty, DPO derivation, GRPO advantage,
PRM vs ORM, ZeRO stages, FSDP vs DDP, activation checkpointing, bf16 vs
fp16, KV cache, continuous batching, FlashAttention, speculative
decoding, reward hacking, length bias, CAI, GAE, importance sampling,
RLHF vs SFT, frozen reference, RM calibration, Tülu 3, RLAIF,
Christiano '17, alignment tax, 37 PPO details, eval harnesses,
IPO/KTO/SimPO, UltraFeedback, Megatron parallelism, Triton, DeepSeek R1,
rule-based rewards — answers ≥200 chars, paragraph-length, no
blurb-summary). `src/state/use-cards.ts` (React hook: hydrates from
`research-desk:v1:cards` once on mount, write-through on each `grade`,
exposes `{states, hydrated, due, upcoming, todayDue, grade, getState,
reset, replace}` with memoised partition).

Rewrote `app/(tabs)/flashcards/page.tsx` end-to-end: perspective-1600px
container with `transform-style: preserve-3d` + rotateX(180deg) 600ms
cubic-bezier flip, keyboard handler (Space flips; 1/2/3/4 grade only
when flipped; ignored inside textarea/input), GradingRow with four
Solarized-tinted buttons (Again=red `#DC322F`, Hard=yellow `#B58900`,
Good=coral `#D97757`, Easy=green `#859900`), DetailsStrip drawer
showing ease/interval/reps/lapses/next-due plus a preview row of what
the next interval/ease would be under each of the four grades,
EmptyState shown when the due queue drains, and a HydratingSkeleton to
suppress SSR-flicker. Sidebar nav (`app/(tabs)/_components/sidebar-nav.tsx`)
now renders a `data-testid=cards-due-badge` coral badge next to
Flashcards on both desktop and mobile variants once `useCards` hydrates
and `todayDue > 0`.

Tests: `src/lib/__tests__/sm2.test.ts` (14 tests — initialState
invariants; good 0→1d / 1→6d / 2→interval×ease; easy first=4d second=7d;
hard drops ease ~0.14; again resets reps, increments lapses, 10-min
relearn, 20× again clamps at 1.3; isDue/dueCount/partitionDeck;
nextIntervalDays) and `src/data/__tests__/flashcards.test.ts` (31 tests
— ≥30 cards, unique ids, non-empty fronts, answers ≥200 chars, no
placeholder tokens, prereqs resolve, plus 25 `it.each` topic-probes
pinning one card id per FINAL_GOAL §4 topic). All gates clean:
`pnpm test` → 81/81 passing in 254ms (10 storage + 14 progress + 14 sm2
+ 31 flashcards + 12 curriculum); `pnpm lint --max-warnings=0`,
`pnpm typecheck`, `pnpm build` all clean — `/flashcards` route is
3.97 kB / 130 kB first-load (up from the 183 B stub).

Observed via bundled playwright-chromium headless (system-Chrome
remote-debug is still blocked by admin policy) driving
`pnpm exec next start -p 3100` at 1440×900 then 375×812:
`/flashcards` → 200, page no longer contains the string
"Shipping next"; `[data-testid=due-count]` → "36";
`[data-testid=card-stage]`'s `data-card-id` on load = `kl-forward-reverse`
(the seed order first element, since no state → all-due → queue preserves
deck order); pressing Space flips `data-flipped` → `true`; pressing `3`
(Good) advances `data-card-id` to `ppo-clipped-surrogate`;
`[data-testid=details-toggle]` opens the drawer showing `detail-ease`
= "2.50", `detail-interval` = "0", `detail-reps` = "0" for the fresh
successor. Reload (`page.reload()`): `data-card-id` stays on
`ppo-clipped-surrogate` — the graded card's new due date (T+1d) has
pushed it out of today's queue, so persistence to
`research-desk:v1:cards` is verified. Sidebar badge
`data-testid=cards-due-badge` reads "36" on initial hydration. Body
computed style: `{ background: rgb(253, 246, 227), color: rgb(88, 110,
117) }` — theme tokens intact.

Known visual issue not fully resolved this iteration: under headless
Chromium `backface-visibility: hidden` combined with
`transform-style: preserve-3d` doesn't always hide the rear face
cleanly — the captured screenshots show the wrong face painted on top
even though React state (`data-flipped`, `aria-hidden`) is correct and
all behavioural assertions (flip, grade, advance, persist) pass. The
behaviour is correct; the visual layer needs an opacity/pointer-events
crossfade on top of the 3D transform to be bulletproof across
renderers. Flagged for the next iteration — doesn't change any of the
functional invariants above.

Screenshots archived under `/tmp/research-desk-shots/s086/{01-front,
02-flipped,03-advanced,04-details,05-mobile,06-sidebar}.png`. Still
outstanding for later iterations: ≥10 papers data + per-paper reveal
pages, markdown notebook with autosave, export/import JSON UI, streak
tracker, real dashboard widgets (current-phase / Continue / due count),
the flip-crossfade polish, Lighthouse report, README screenshot.

## 2026-04-27 · S-104 · Papers tab — 11 canonical papers, per-paper reveal-gated pages

Replaced the `/papers` TabStub with the full authored surface. New
modules: `src/data/papers.ts` (11 canonical papers — InstructGPT, PPO,
Christiano'17, DPO, Constitutional AI, DeepSeek-R1, Let's Verify, ZeRO,
FlashAttention v1+v2, RLAIF, plus the DeepSeekMath/GRPO paper that R1
assumes you've read; each with authors, year, venue, real arxiv.org URL,
a 3–5 sentence editorial why-this-matters paragraph in the voice of a
research mentor, and 5–7 pointed comprehension questions — no "what is
the paper about" trivia; every question tests a load-bearing detail like
'Write the clipped surrogate objective L^CLIP from memory' or 'Show
where the partition function Z(x) cancels in the DPO derivation'),
`src/data/__tests__/papers.test.ts` (10 structural tests — ≥10 papers,
unique kebab-case slugs, every URL on HOST_ALLOWLIST, canonical-10
coverage pinned by slug, 5–7 questions each, ≥200-char summaries, no
placeholder tokens, both tracks represented),
`src/state/use-paper-answers.ts` (hook + exported `REVEAL_THRESHOLD=40`
so the UI and test can't drift — autosaves to
`research-desk:v1:paper-answers` as `Record<paperSlug, Record<qId,
string>>` with a 250ms debounce and on-unmount flush; `canReveal(slug,
qid)` trims whitespace before counting). Rewrote
`app/(tabs)/papers/page.tsx` as a server component that renders 11 paper
cards grouped by track (Primary — RLHF, Supporting — MLE-fundamentals)
with serif titles on parchment `bg-solar-100`, year/venue chips and
question counts in Solarized blue `text-sol-blue`, first-sentence
excerpts of each editorial summary. New dynamic route
`app/(tabs)/papers/[slug]/page.tsx` (server component with
`generateStaticParams` → every paper prerendered at build time,
`dynamicParams=false` so unknown slugs 404) delegates to a client
`paper-reader.tsx` that shows the authors, coral canonical-URL link
(`rel="noreferrer"` target="_blank"), the editorial summary, then 5–7
`QuestionBlock` cards each with a persisted textarea, a live "N chars · M
to unlock" counter, and a coral "Reveal my answer" button disabled until
trimmed length ≥40. Revealing shows the user's OWN typed draft
re-rendered as read-only serif prose, with explanatory microcopy ("You
committed this answer. Now open the paper and grade yourself against
it") — there are no canonical answer keys, matching FINAL_GOAL §3.4's
"no LLM grading, user is trusted to self-grade" hard requirement.

Tests: `pnpm test` → 91/91 passing in 256ms (added 10 new papers tests
to the existing 81 — sm2/progress/storage/curriculum/flashcards still
clean). `pnpm lint --max-warnings=0` and `pnpm typecheck` clean. `pnpm
build` succeeds with 21 static pages including 11 prerendered
`/papers/[slug]` routes (route size 2.66 kB / 112 kB first-load;
`/papers` index is 180 B / 109 kB).

Observed via bundled playwright-chromium headless (system Chrome still
blocked by admin policy) driving `pnpm exec next start -p 3100` at
1440×900 and 375×812:
`GET /papers` → 200, `[data-testid=paper-card]` count = 11, slug set
contains all ten canonical slugs from FINAL_GOAL §4 plus
`grpo-deepseekmath`. Clicking the InstructGPT card navigates to
`/papers/instructgpt`, `[data-testid=paper-title]` reads "Training
language models to follow instructions with human feedback
(InstructGPT)". Q1's reveal button starts `disabled=true` /
`data-can-reveal=false`. Typing 30 chars into `[data-testid=answer-
textarea]` → still disabled. Typing a 219-char paragraph → button
enables (`disabled=false`, `data-can-reveal=true`). Clicking reveal
renders `[data-testid=revealed-panel]` with the user's draft rendered
as read-only serif prose + the "grade yourself against the paper"
microcopy. After `page.reload({waitUntil:'networkidle'})` the textarea
value equals the exact 219-char answer (persistence verified), the
reveal button is still enabled, and `localStorage.getItem('research-
desk:v1:paper-answers')` parses to `{version:1, data:{instructgpt:
{'alignment-tax': '…'}}}`. Shortening the answer back to 5 chars
re-disables the reveal button — the hook's `canReveal` is reactive,
not a one-shot latch. Body computed style on `/papers/dpo` reports
`{background: rgb(253,246,227), color: rgb(88,110,117)}` — the cream
`#FDF6E3` + slate `#586E75` theme tokens are intact. Screenshots
archived at `/tmp/research-desk-shots/s104/{01..06}.png`. All 9
scripted assertions passed; see
`/tmp/research-desk-shots/s104/drive.log` for the timestamped trace.

Still outstanding for later iterations: Dashboard widgets (current-
phase progress card, Continue jump, upcoming 3–5, due-flashcards CTA,
per-phase bars, weekly streak) plus the streak-writer reducer, Notes
markdown notebook with ≥3 pages + autosave, Export/Import JSON UI,
`lighthouse.json` committed, README rewrite to Solarized Light +
coral with a real UI screenshot, flashcard-flip crossfade polish,
axe-automated a11y audit.

## 2026-04-27 · S-114 · Dashboard tab: 6 live widgets + streak reducer

Replaced the "coming online" Dashboard stub with the real daily
landing that FINAL_GOAL §3.1 names. New `src/lib/streak.ts` is a
pure reducer (no React, no I/O): `StreakState { days:string[],
cardsToday:{date,count}, lastTouched?:{id,at} }`, with
`recordProgressDone` / `recordProgressTouch` / `recordCardReview`
(threshold `DAILY_CARD_THRESHOLD=5`) and projections `last7` /
`streakCount` / `currentRun`. `src/lib/__tests__/streak.test.ts`
adds 20 cases (isoDate, idempotent day insert, threshold rollover,
last-7 projection, consecutive-run counting). `src/state/use-
streak.ts` wraps the reducer over `research-desk:v1:streak` with
hydrate-on-mount and a custom `research-desk:streak-change` window
event so cross-hook writes re-render live within one document (the
`storage` event only fires across tabs). `use-progress.ts` now
side-effects into the streak blob on every `cycle` / `set` (done →
adds today, any touch → updates `lastTouched` for the Continue
widget). `use-cards.ts` calls `recordCardReview` on every grade,
which only marks the day once 5 reviews land. `app/(tabs)/
curriculum/page.tsx` now reads `?item=<id>` through `useSearchParams`
inside a `Suspense` boundary and opens the side-sheet on mount, so
Dashboard's Continue CTA lands directly in the detail view.

The Dashboard page itself (`app/(tabs)/dashboard/page.tsx`) is a
client component with six widgets in a deliberate top-to-bottom
order: CurrentPhaseCard (earliest phase with a non-done item, with
a coral progress bar + done/inprog/pending counts) and ContinueCard
(most-recently-touched inprog item, else first inprog, else first
pending) in the first row; DueTodayCard (coral CTA "Review N cards"
into `/flashcards`) and StreakCard (7 dots with TODAY slot ringed,
count + consecutive-run text) in the second row; NextUp listing the
next 3–5 queued items of the current phase with type·time·track
meta; per-phase progress bars for all five phases. A fresh-profile
render shows "0 of 55 done", Phase 1 Foundations at 0/11, Continue
pointing at `p1-sutton-barto` (first pending), Due Today = 36 cards,
streak = 0 days, 5 next-up rows populated from the authored
curriculum.

Observed via bundled Playwright (MCP's system-Chrome is still blocked
by `DevTools remote debugging is disallowed by the system admin` on
this machine) against `pnpm start -p 3100`: GET `/dashboard` returns
HTTP 200 with 32 KB HTML. DOM probe at 1440×900: `[data-testid=
current-phase-card]` ×1, `[data-testid=continue-link]` href =
`/curriculum?item=p1-sutton-barto`, `[data-testid=due-today-cta]`
text "Review 36 cards" href=`/flashcards`, `[role=progressbar]` ×6
(1 current-phase + 5 per-phase), `[data-testid^="streak-dot-"]` ×7,
`[data-testid=next-up-row]` ×5, `[data-testid^="phase-row-"]` ×5,
zero matches for "coming online" or "Curriculum is the first
surface". Clicking `[data-testid=continue-link]` navigates to
`/curriculum?item=p1-sutton-barto` and the detail sheet is present
in the DOM (`sheetOpen: true`), confirming the Dashboard ↔
Curriculum handoff is live end-to-end. Screenshots archived at
`/tmp/dashboard.png` and `/tmp/dashboard-after-deeplink.png`.

Quality gates: `pnpm test` green at 111/111 (20 new streak tests +
prior suites), `pnpm lint --max-warnings=0` clean, `pnpm typecheck`
clean, `pnpm build` clean — `/dashboard` route weighs 4.03 kB /
141 kB first-load, `/curriculum` unchanged at its prior budget. No
stale copy left on Dashboard; the only remaining "coming online"
strings in the repo live in this WORKLOG itself.

Still outstanding for later iterations: Notes markdown notebook
with ≥3 pages + autosave, Export/Import JSON UI, `lighthouse.json`
committed, README rewrite to Solarized Light + coral with a real UI
screenshot, flashcard-flip crossfade polish, axe-automated a11y
audit.

## 2026-04-27 · S-122 · Notes tab — multi-page markdown notebook w/ autosave + live preview

Replaced the `/notes` TabStub ("SHIPPING NEXT" + "BUILD PROGRESSES TAB
BY TAB") with the real notebook FINAL_GOAL §3.5 names. New modules:
`src/lib/notes.ts` (pure model — `NotePage`, `NotesState`, three frozen
`DEFAULT_PAGES` — Notes / Scratch / Weekly log — each with authored
seed markdown; `initialNotesState`, `normalizeNotesState` that coerces
any payload back to a valid shape and backfills any missing default
page so a partial localStorage blob never strands the user; `setPageBody`
pure update returning the same object if nothing changed),
`src/lib/markdown.tsx` (a small, safe, pure-React markdown renderer —
ATX headings h1..h6, fenced code, blockquotes, `-`/`*` ul, `1.` ol,
paragraphs, inline `**bold**` / `*italic*` / `` `code` `` /
`[text](url)`; URLs scheme-filtered to http(s) so typed
`javascript:`/`data:` never become live anchors; no
`dangerouslySetInnerHTML` anywhere, every node is a React element),
`src/state/use-notes.ts` (`useNotes` hook: hydrate once on mount from
`research-desk:v1:notes`, write-through with a 250ms debounce, flush on
unmount so the last keystroke always lands, `replace` for the future
Import JSON flow), and `src/components/notes-editor.tsx` (the `/notes`
surface: Fraunces header "The notebook.", coral page tab bar with
three `data-testid=page-tab-<id>` pills, AUTOSAVE ON indicator
switching to AUTOSAVED on first edit; desktop ≥lg shows a 2-column
grid with a Geist-Mono textarea on `bg-solar-50` and a rendered
preview on `bg-solar-100/60`; below lg, a pill switcher toggles a
single column between "Write" and "Preview"). `app/(tabs)/notes/page.tsx`
is now a thin server-boundary wrapper around `<NotesEditor />`.

Tests: added `src/lib/__tests__/notes.test.ts` (7 cases — ≥3 named
defaults, fresh-copy independence, garbage coercion, user-page
preservation + default backfill, duplicate/malformed entry rejection,
`setPageBody` update + no-op-on-unknown-id) and
`src/lib/__tests__/markdown.test.ts` (15 cases — h1..h6 parsing,
fenced code, ul/ol, paragraph cross-line accumulation, blockquote
multi-line, **bold**/*italic*/`code`/links, `javascript:` href
rejection, nested `**run `x`**`, refusal to promote `* spaces *` to
italics). `pnpm test` → 133/133 passing in 303ms (+22 new: 7 notes +
15 markdown). `pnpm lint --max-warnings=0` clean. `pnpm typecheck`
clean (fixed `noUncheckedIndexedAccess` strict-mode cases on every
`lines[i]` / `pages[i]` index). `pnpm build` clean — `/notes` route
is 4.8 kB / 110 kB first-load (up from the 180 B stub), 21 static
pages in total.

Observed via bundled Playwright-chromium headless driving
`pnpm start -p 3100` from `scripts/drive-notes.mjs` — 19/19 acceptance
assertions pass. Desktop 1440×900: `[data-testid=notes-editor]`
renders, `page.locator("textarea").count() === 1`,
`[data-testid^="page-tab-"].count() === 3` with labels
`["Notes","Scratch","Weekly log"]`. Body text contains zero instances
of "Shipping next", "TabStub", or "build progresses tab by tab".
Typing `"hello **world**"` into the textarea and waiting 400ms
(> 250ms debounce) yields a live preview whose
`[data-testid=preview-body] strong` node has textContent `"world"`.
`localStorage.getItem("research-desk:v1:notes")` parses to
`{version:1, data:{pages:Array(3)}}`; active page body is exactly
`"hello **world**"`. `page.reload({waitUntil:"networkidle"})` → the
textarea value is still `"hello **world**"` (persistence verified).
Clicking `page-tab-scratch` swaps the textarea to the seed Scratch
body; clicking `page-tab-weekly-log` swaps again — each page's body
is isolated. Mobile 375×812: the `Write`/`Preview` pill switcher is
present; clicking `mobile-pane-preview` hides the write pane and
shows the preview; clicking back re-shows the write pane. Body
computed style on `/notes` is `{background: rgb(253, 246, 227),
color: rgb(88, 110, 117)}` — cream `#FDF6E3` / slate `#586E75`,
theme tokens intact. A rich-markdown screenshot
(`/tmp/research-desk-shots/s122/10-rich-markdown.png`) shows a typed
paragraph with Fraunces serif heading, slate bold for `PPO`,
Solarized-blue inline code for `r(θ)`, coral list bullets, and a
coral-bordered blockquote — production-grade visual polish, not
placeholder text. Screenshots archived at
`/tmp/research-desk-shots/s122/{01-notes-initial, 02-notes-typed,
03-weekly-log-tab, 04-mobile-preview, 05-mobile-write,
10-rich-markdown, 11-mobile-preview-default}.png`.

Still outstanding for later iterations: Export/Import JSON UI,
`lighthouse.json` committed, README rewrite to Solarized Light +
coral with a real UI screenshot, flashcard-flip crossfade polish,
axe-automated a11y audit.

## 2026-04-28 · S-126 · Export / Import JSON UI

Added visible "Export data" / "Import data" buttons on `/dashboard`
that round-trip every `research-desk:v1:*` slot through one JSON
file (FINAL_GOAL.md §2). `src/lib/storage.ts` grew a pure,
injectable serializer — `buildExportBundle`, `serializeExportBundle`,
`parseImportBundle`, `summarizeBundle`, `applyImportBundle` — that
emits `{schema:"research-desk", version:1, exportedAt, data:{...6
slots}}` and refuses unknown versions / wrong schema / malformed
JSON with one of five structured error codes. `src/components/
data-export-import.tsx` renders the coral-CTA Export button, the
ghost Import button, a hidden file input, and an inline
`role="dialog"` confirmation panel that previews which of the six
slots will be written before the user clicks "Overwrite my data".
Successful import reloads the page 400ms later so every hook
rehydrates from its single source of truth. Null slots in the
bundle are skipped rather than wiped, so partial exports don't
destroy state.

Quality gates: 149 / 149 Vitest tests pass (16 new in
`src/lib/__tests__/export-import.test.ts` covering schema/version
guard, round-trip, all five error codes, null-skip semantics);
`pnpm lint --max-warnings=0`, `pnpm typecheck`, `pnpm build` all
clean. Dashboard bundle grew from 4.03 kB → 5.99 kB.

Observed via bundled Playwright (MCP Chrome blocked by admin
policy) at `/Users/hanyusong/RLHF/research-desk/scripts/
drive-export-import.mjs`: 34 / 34 assertions passed end-to-end —
seeded localStorage fixture, clicked Export, captured the
`research-desk-2026-04-28.json` download, parsed it and asserted
every slot round-tripped (progress sutton=done, cards KL-card
EF=2.6, paper-answers instructgpt alignment-tax 219-char paragraph,
3 notes pages, 3 streak days, item-notes sutton). Then wiped
localStorage, re-uploaded via `setInputFiles`, saw all 6 slots
marked present in the confirm dialog, clicked "Overwrite my data",
waited for the reload, and asserted every v1 envelope rehydrated
exactly. Version-guard case: uploading `{schema:"research-desk",
version:99,...}` surfaced the inline "IMPORT FAILED — This export
is from a different schema version (v99)…" error with no confirm
dialog and no crash; the Data card stayed mounted. Wrong-schema
case: uploading `{schema:"some-other-app",version:1,...}` surfaced
"IMPORT FAILED — This file isn't a Research Desk export (saw schema
'some-other-app')". Screenshots archived at
`/tmp/research-desk-shots/s126/{01-dashboard-data-section,
02-import-confirm, 03-post-import-dashboard,
04-version-guard-error}.png`.

## 2026-04-28 · S-130 · Committed lighthouse.json + README rewrite + dead-code sweep

Closed the last three FINAL_GOAL hard-requirements the judge called out.
(1) Committed `lighthouse.json` at the repo root — an audit of
`http://localhost:3100/` (production `pnpm start` build) with
`--only-categories=performance,accessibility,best-practices,seo`. Final
scores: performance 0.95, accessibility 0.95, best-practices 1.00, SEO
1.00 — all ≥ 0.95 as FINAL_GOAL §1 requires. Added `lighthouse` and
`chrome-launcher` as devDeps and wired a `pnpm lighthouse` script in
`package.json` so the report is reproducible from a clean clone with
`pnpm build && pnpm start -p 3100 & && pnpm lighthouse`. One config
change was required to unblock the SEO audit: `app/layout.tsx` flipped
`robots` from `{ index:false, follow:false }` (the old "noindex" that
was tanking SEO to 0.60) to `{ index:true, follow:true }`, which took
the SEO category from 0.60 → 1.00. Lighthouse acceptance test —
`cat lighthouse.json | node -e "…if(score<0.95)exit(1)…"` — exits 0.

(2) Rewrote `README.md` end-to-end. The old copy still advertised the
deleted dark-editorial aesthetic ("#0f0e0c", cream text, amber accent,
SVG grain, "no generic chatbot dark mode") and falsely claimed the
Dashboard / Curriculum / Flashcards / Papers / Notes tabs "land in
subsequent iterations" when every tab is shipped. The new README leads
with a committed screenshot at `docs/screenshot.png`, enumerates what
each of the five tabs actually ships (55 curriculum items, 36 SM-2
flashcards, 11 canonical papers, 3-page markdown notebook with
autosave, 6-widget Dashboard), documents Vercel / Netlify / Cloudflare
Pages deploy paths, documents `pnpm lighthouse` regeneration, and
describes the real Solarized Light + Claude coral palette (`#FDF6E3`
cream, `#EEE8D5` parchment, `#586E75` slate, `#D97757` coral) instead
of the dark theme that was ripped out in S-016.

(3) Captured the screenshot at `docs/screenshot.png` (1440×900, 2×
device scale, 264 KB) by driving bundled Playwright chromium against
`/dashboard` on the production `pnpm start -p 3100` build via
`scripts/take-readme-shot.mjs`. Read back the saved PNG with the Read
tool — the render is production-grade: cream `#FDF6E3` body, the
248px Solarized-parchment sidebar with the coral dot wordmark,
"Dashboard" with the "NOW" active chip and a coral "36" due-count
badge next to Flashcards, the Fraunces serif h1 "The desk, today.",
the Current Phase / Continue / Due Today / Streak widget grid on
parchment panels with the Solarized ramp, and the coral "REVIEW 36
CARDS" CTA — every palette rule in FINAL_GOAL §5 is visibly obeyed.

(4) Deleted the dead `app/(tabs)/_components/tab-stub.tsx` file — zero
importers remained across `app/**` and `src/**`; the only mentions
were this WORKLOG and ARCHITECTURE.md, both of which were pruned.
Updated `ARCHITECTURE.md` to drop the tab-stub from the directory
listing and added a new "Lighthouse" section documenting the
report-regeneration flow.

Quality gates: `pnpm lint --max-warnings=0` clean, `pnpm typecheck`
clean, `pnpm test` → 149/149 passing in 311ms, `pnpm build` clean —
every tab route unchanged (dashboard 5.99 kB / 143 kB, curriculum
6.49 kB / 122 kB, flashcards 3.97 kB / 131 kB, notes 5.4 kB / 111 kB,
papers index 174 B / 109 kB, papers/[slug] 3.27 kB / 112 kB, 11 static
paper pages prerendered). `cat lighthouse.json | node -e "for(const k
of ['performance','accessibility','best-practices','seo'])if(l.categories[k].score<0.95)exit(1)"`
exits 0 against the committed report.

## 2026-04-28 · S-136 · Delete Dashboard; curriculum becomes home

Executed the "radical simplification" mandate (commit 4788b69). Deleted
the `/dashboard` route group (`app/(tabs)/dashboard/**`) along with all
five widgets (Current Phase, Continue, Due Today, Streak, Next-Up, and
the per-phase progress bars). Dropped the streak model (`src/lib/streak.ts`),
its hook (`src/state/use-streak.ts`), and its test file. Removed the streak
side-effect calls from `use-progress.ts` (no more `recordProgressTouch` /
`recordProgressDone`) and `use-cards.ts` (no more `recordCardReview` plus
the custom `research-desk:streak:v1` event bus). Rewrote `app/page.tsx`
as a server `redirect("/curriculum")` and added `app/dashboard/page.tsx`
(outside the `(tabs)` group so the redirect fires before any sidebar chrome
renders) as a second redirect for legacy bookmarks. Shrank the sidebar
`TABS` array from 5 to 4 — the bottom-nav no longer needs its `.slice(0,4)`
truncation. Moved `DataExportImport` from its dashboard slot to a
footer section on `/curriculum` so the "one JSON file" export surface
still has a home. Streak slot is kept in `EXPORT_SLOT_NAMES` for
back-compat with user-exported JSON bundles, so existing exports still
round-trip cleanly.

Acceptance verified by hand:
(a) `curl -sI http://localhost:3100/dashboard` under `pnpm start` returns
    `HTTP/1.1 307 Temporary Redirect` with `location: /curriculum`. `/`
    behaves identically.
(b) `grep -rE 'streak-dot-|current-phase-card|due-today-cta|continue-link|phase-row-' app src`
    returns zero matches.
(c) Rendered DOM on `/curriculum` shows exactly four `<a>` children inside
    the sidebar `<nav aria-label="Primary">`: Curriculum · Flashcards ·
    Papers · Notes. No Dashboard.

Observed via Playwright MCP at 1440×900 against the production `pnpm
start` build: navigating to `http://localhost:3100/` lands on
`/curriculum` with the four-tab sidebar, the Fraunces serif "Foundations"
phase header, the filter chips (`phase`, `kind`, `track`), the first 11
items under Phase 1, and the new parchment-bordered Export/Import footer
pinned below the list. Clicking "Flashcards" in the sidebar routes to
`/flashcards` with the card-flip surface intact (the Forward vs reverse
KL prompt renders; 1/2/3/4 grade buttons and "Back to curriculum"
backlink work). Screenshots archived at
`s136-01-root-redirects-to-curriculum.png`,
`s136-02-curriculum-desktop.png`,
`s136-03-curriculum-footer-export-import.png`,
`s136-04-export-import-footer.png`,
`s136-07-flashcards-page.png`.

Quality gates: `npx tsc --noEmit` clean, `pnpm lint` clean, `pnpm test`
→ 129/129 passing (20 streak tests removed with the deletion), `pnpm
build` clean — `/` and `/dashboard` both show as static 140 B redirect
routes, `/curriculum` grew by ≈ 1 kB after absorbing the Export/Import
footer, no other route deltas.

## 2026-04-28 · S-146 · /notes collapsed to single scratchpad — no tabs, no pages

Executed FINAL_GOAL.md §3 Page 4: "No multiple named pages. No tabs.
Just one persistent scratchpad." `NotesState` in `src/lib/notes.ts` is
now exactly `{ body: string }`; the `DEFAULT_PAGES` array, `NotePage`
interface, and `setPageBody` update helper are deleted. `DEFAULT_BODY`
is a single seed markdown string. `normalizeNotesState` still accepts
three shapes — canonical `{body}`, bare string, legacy `{pages:[…]}`
multi-page (concatenated bodies so nothing a user typed under the old
schema is stranded on upgrade). `useNotes` exposes `body` / `setBody`
instead of the previous `pages` / `setBody(pageId, body)` surface and
rewrites the persisted payload to canonical shape on hydration when
the stored form isn't already `{body}`. `NotesEditor` drops the page
tab bar and mounts a single `<textarea>` (Geist Mono) side-by-side
with the live markdown preview on desktop; the mobile Write / Preview
pill switcher is retained.

Tests rewritten: `src/lib/__tests__/notes.test.ts` now asserts the
single-body shape (`Object.keys(state) === ["body"]`, `toHaveProperty("pages")`
is false), exercises the three migration paths of
`normalizeNotesState` (canonical, bare string, legacy pages →
concatenated body), and covers `setBody` purity + no-op on unchanged
input. `pnpm test` → 133/133 passing (+4 net from the replacement
suite: 7 → 11). `pnpm lint --max-warnings=0`, `pnpm typecheck`, `pnpm
build` all clean; `/notes` route shrank 5.4 kB → 4.54 kB after the
tab-bar and page-switching logic came out.

Observed via Playwright MCP against `pnpm start -p 3100`:
`[data-testid^="page-tab-"].count() === 0`, `textarea.count() === 1`,
header "The notebook." + "One persistent markdown scratchpad" copy.
Typed `hello **world** from s146` into the textarea; 500 ms later the
preview's `strong` textContent was `"world"` and
`localStorage.getItem("research-desk:v1:notes")` parsed to
`{version:1, data:{body:"hello **world** from s146"}}` — canonical
shape, no `pages` key. `page.goto('/notes')` (full reload) restored
the same body. Legacy-migration probe: seeded
`{version:1, data:{pages:[{id:"notes",body:"# Old Notes\nthese notes…"},
{id:"scratch",body:"old scratch…"}, {id:"weekly-log",body:"w/c …"}]}}`
and reloaded — textarea value came back as the three bodies
concatenated with `\n\n`, `page-tab-*` count still 0, and the stored
envelope was rewritten to `{body:"# Old Notes\n…\n\nold scratch…\n\nw/c …"}`.
Screenshots opened and inspected:
`s146-01-notes-single-scratchpad.png` (fresh-profile desktop — Fraunces
"Notebook" h1 in the preview, Geist-Mono textarea on cream, coral
list bullets, Solarized-blue inline code chips),
`s146-02-notes-after-legacy-migration.png` (concatenated legacy bodies
rendered cleanly), `s146-04-notes-mobile-write.png` (desktop post-clear
baseline). Zero visual regressions in the sidebar — the four tabs
(Curriculum · Flashcards · Papers · Notes) and the coral "36" due-count
badge still render as designed.

## 2026-04-28 · S-154 · Curriculum — kill the side-sheet, inline everything

Executed FINAL_GOAL.md §3 Page 1 + §5 ("No sidesheets or drawers. Everything
inline."). Deleted `src/components/curriculum-detail-sheet.tsx` outright —
the `<aside role="dialog">` 520px right-hand panel the judge flagged is
gone, along with its `detail-backdrop` / `detail-sheet` / `detail-notes` /
`detail-url` testids and the `openId` / `?item=<id>` deep-link state that
wired it. `app/(tabs)/curriculum/page.tsx` no longer imports it, no longer
holds open-sheet state, and no longer mounts a Suspense-wrapped
`useSearchParams` reader (the deep-link was only meaningful when the
sheet existed). Every piece of per-item information the sheet surfaced
now lives on the row itself, always visible: full focus note as body
text, canonical URL as a coral external link (`target="_blank"
rel="noreferrer"`), prerequisites as mono chips, an always-visible
autosaving `<textarea data-testid="row-notes-{id}">`, the state pill
inline in the title row, and a coral cycle CTA whose label adapts
(Start / Mark done / Reset). The row `<article>` exposes
`data-item-id` + `data-state` so the judge's Playwright probes still
have stable hooks.

Header rewritten per §5: the 4-metric TOTAL/DONE/IN PROGRESS/PENDING
row is replaced by a single serif line rendering exactly `{done} of
{total} done · {todayDue} cards due today`, live-read from
`useProgress().progress.summarize()` + `useCards().todayDue`. The
"Click a row title to open the side-sheet with the full focus note…"
prose is replaced with one short line describing the drawer-free
reality. Also renamed the Export/Import confirm dialog's streak slot
label from "Streak" → "Legacy (streak)" and stripped the stale
"streak" name from the Your-Data footer copy — the streak widget was
deleted in S-136 but the export dialog was still telling users about
it.

Acceptance verified via Playwright MCP against production `pnpm start
-p 3100` at 1440×900 (screenshots opened and inspected, not just
captured): `document.querySelectorAll('[role="dialog"]').length === 0`
on `/curriculum`; `data-testid="curriculum-row"` count === 55;
`row-url-*` / `row-notes-*` / `row-cycle-*` / `row-state-pill`
counts all === 55; `row-focus-note-*` count === 55; dashboard text
renders exactly `"0 of 55 done · 35 cards due today"` at first paint.
Clicking the first row's cycle CTA advances the pill from PENDING →
IN PROGRESS (button text "Mark done"), then → DONE (button "Reset")
with the title gaining strikethrough and a green ✓ icon; dashboard
recounts live to `"1 of 55 done"`. Typing into the inline
`row-notes-p1-sutton-barto` textarea and reloading the tab restores
exactly `"Derive §4 Bellman by hand tomorrow"` from
`research-desk:v1:item-notes` — inline-notes persistence is intact
without any sheet ever opening. Uploading a valid export bundle pops
the `import-confirm` inline panel whose streak slot now reads
`"Legacy (streak)"` (screenshot `s154-03-import-confirm-legacy-streak.png`),
not the old `"Streak"`.

Quality gates: `pnpm typecheck` clean, `pnpm lint --max-warnings=0`
clean, `pnpm test` → 133/133 passing in 298ms (no test rewrites
required — the sheet had no dedicated Vitest suite, its persistence
was already covered by storage + progress tests), `pnpm build` clean
— `/curriculum` route 14.7 kB → 15.4 kB (the per-row textarea and
inline URL markup), every other route byte-identical. Acceptance
grep `grep -R 'role="dialog"' app src --include='*.tsx'` on the
curriculum surface returns zero hits (`app/(tabs)/curriculum/page.tsx`
only mentions the forbidden pattern inside a leading comment that
documents why it's forbidden); the remaining `role="dialog"` site-
wide is the Export/Import confirm panel, which is a user-initiated
action confirmation, not a curriculum detail drawer.

Screenshots archived at the repo root: `s154-01-curriculum-header.png`
(fresh profile: "0 of 55 done · 35 cards due today" single-line
dashboard, filter bar, Phase 1 header, first row with inline focus
note + coral URL + empty NOTES textarea + coral START CTA — no
overlay, no modal), `s154-02-curriculum-row-done-with-notes.png`
(first row after cycle×2: strikethrough serif title, green DONE
pill, green ✓ checkbox, "1 of 55 done" dashboard, inline notes
holding typed text, coral RESET cycle CTA), and
`s154-03-import-confirm-legacy-streak.png` (Export/Import footer
panel with the renamed slot). ARCHITECTURE.md updated to drop the
"+ side-sheet" annotation from the curriculum route description;
`app/globals.css` palette comment updated to drop the stale
"side-sheets" surface mention.
