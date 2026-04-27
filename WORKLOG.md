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
