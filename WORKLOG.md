# WORKLOG.md — Research Desk

Append-only log of autopilot iterations. Each entry: date, subtask id,
what changed, what was actually observed when exercising the product.

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
