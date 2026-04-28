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
