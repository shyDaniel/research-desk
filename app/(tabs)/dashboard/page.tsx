"use client";

// app/(tabs)/dashboard/page.tsx
//
// Dashboard tab — the daily landing. FINAL_GOAL.md §3.1 defines six widgets
// in strict terms; this module wires each one against the shared client
// hooks (use-progress / use-cards / use-streak) and the static curriculum
// content. No placeholder status copy — every surface this file references
// ships in prior iterations and the user is owed a live, accurate status.
//
// Widget layout (top-to-bottom):
//   1. CURRENT PHASE  — earliest phase with ≥1 non-done item, progress bar.
//   2. CONTINUE        — link to /curriculum?item=<id> of the last-touched
//                        in-progress item (falls back to first pending in
//                        current phase so the block is never empty).
//   3. DUE TODAY       — count + coral CTA into /flashcards.
//   4. STREAK STRIP    — 7 dots representing the last 7 local-calendar days.
//   5. NEXT UP         — next 3–5 pending items of the current phase.
//   6. ALL PHASES      — one progress bar per phase (5 total).

import Link from "next/link";
import { useMemo } from "react";

import { CURRICULUM } from "@/data/curriculum";
import { getProgress, summarize } from "@/lib/progress";
import type { Phase } from "@/data/types";
import { useCards } from "@/state/use-cards";
import { useProgress } from "@/state/use-progress";
import { useStreak } from "@/state/use-streak";

const PHASE_META: Record<
  Phase,
  { title: string; blurb: string }
> = {
  1: {
    title: "Foundations",
    blurb:
      "RL vocabulary, policy-gradient theorem, KL, importance sampling. Before any RLHF paper.",
  },
  2: {
    title: "PPO & Reward Modeling",
    blurb:
      "Clipped surrogate, GAE, Bradley-Terry RMs, length bias. First end-to-end RLHF build.",
  },
  3: {
    title: "DPO family & Constitutional AI",
    blurb:
      "DPO derivation, IPO, KTO, SimPO, CAI two-stage recipe — PPO's offline cousin.",
  },
  4: {
    title: "Reasoning RL",
    blurb:
      "PRMs vs ORMs, DeepSeek-R1, GRPO, rule-based verifiable rewards.",
  },
  5: {
    title: "Specialization & MLE infra",
    blurb:
      "Tülu 3 recipe, ZeRO/FSDP, FlashAttention, eval harnesses, reward hacking.",
  },
};

const PHASES: Phase[] = [1, 2, 3, 4, 5];

export default function DashboardPage() {
  const { progress, hydrated: progressHydrated } = useProgress();
  const { todayDue, hydrated: cardsHydrated } = useCards();
  const {
    last7,
    count: streakCount,
    run: streakRun,
    state: streakState,
    hydrated: streakHydrated,
  } = useStreak();

  // Precompute per-phase rollups once per render.
  const byPhase = useMemo(() => {
    return PHASES.map((phase) => {
      const items = CURRICULUM.filter((c) => c.phase === phase);
      const ids = items.map((i) => i.id);
      const s = summarize(progress, ids);
      const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
      const pending = items.filter(
        (i) => getProgress(progress, i.id) === "pending"
      );
      const inprog = items.filter(
        (i) => getProgress(progress, i.id) === "inprog"
      );
      return { phase, items, ids, summary: s, pct, pending, inprog };
    });
  }, [progress]);

  // "Current phase" = earliest phase with at least one non-done item.
  // Falls back to phase 5 if every item is already done (perfect run).
  const currentPhase =
    byPhase.find((p) => p.summary.done < p.summary.total) ?? byPhase[4]!;

  // Continue target: the most recently touched item, if it still isn't
  // done. Falls back to the first in-progress item of the current phase,
  // then to the first pending item. Null only if the entire 55-item
  // curriculum is complete.
  const continueItem = useMemo(() => {
    const touched = streakState.lastTouched?.id;
    if (touched) {
      const item = CURRICULUM.find((i) => i.id === touched);
      if (item && getProgress(progress, item.id) !== "done") return item;
    }
    if (currentPhase.inprog[0]) return currentPhase.inprog[0];
    if (currentPhase.pending[0]) return currentPhase.pending[0];
    return null;
  }, [streakState.lastTouched, progress, currentPhase]);

  // Next 3–5 upcoming in the current phase: prefer inprog items first,
  // then pending, skipping the one already surfaced in Continue.
  const nextUp = useMemo(() => {
    const queue = [...currentPhase.inprog, ...currentPhase.pending].filter(
      (it) => it.id !== continueItem?.id
    );
    return queue.slice(0, 5);
  }, [currentPhase, continueItem]);

  const totalSummary = useMemo(
    () => summarize(progress, CURRICULUM.map((i) => i.id)),
    [progress]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Dashboard
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          The desk, today.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          <span className="text-solar-700">
            {totalSummary.done} of {totalSummary.total} curriculum items done
          </span>
          . Your current phase, your next items, and the flashcards the
          scheduler wants you to see today — in one glance.
        </p>
      </header>

      {/* Row 1: CURRENT PHASE + CONTINUE ──────────────────────────────── */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <CurrentPhaseCard
          phase={currentPhase.phase}
          pct={currentPhase.pct}
          summary={currentPhase.summary}
          hydrated={progressHydrated}
        />
        <ContinueCard item={continueItem} hydrated={progressHydrated} />
      </section>

      {/* Row 2: DUE TODAY + STREAK ───────────────────────────────────── */}
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <DueTodayCard
          count={cardsHydrated ? todayDue : 0}
          hydrated={cardsHydrated}
        />
        <StreakCard
          slots={last7}
          count={streakCount}
          run={streakRun}
          hydrated={streakHydrated}
        />
      </section>

      {/* NEXT UP ────────────────────────────────────────────────────── */}
      <section
        aria-label="Next up in the current phase"
        data-testid="next-up"
        className="mt-12"
      >
        <div className="flex items-baseline justify-between border-b border-solar-200 pb-3">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
              Next up
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-tight text-solar-800">
              The next few in Phase {currentPhase.phase}.
            </h2>
          </div>
          <Link
            href="/curriculum"
            className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600 hover:text-coral-600"
          >
            See all →
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          {nextUp.length === 0 ? (
            <li
              data-testid="next-up-empty"
              className="rounded-sm border border-solar-200 bg-solar-100/50 px-4 py-6 text-center text-sm text-solar-600"
            >
              Phase {currentPhase.phase} is clean. Promote an item to Phase{" "}
              {Math.min(currentPhase.phase + 1, 5)} or swing back to Curriculum.
            </li>
          ) : (
            nextUp.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/curriculum?item=${encodeURIComponent(item.id)}`}
                  data-testid="next-up-row"
                  className="flex items-start gap-4 rounded-sm border border-solar-200 bg-solar-50 px-4 py-3 transition-colors hover:border-coral-400"
                >
                  <span
                    aria-hidden
                    className={
                      "mt-1 inline-block h-2 w-2 shrink-0 rounded-full " +
                      (getProgress(progress, item.id) === "inprog"
                        ? "bg-coral-500"
                        : "bg-solar-300")
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[16px] leading-snug text-solar-800">
                      {item.title}
                    </span>
                    <span className="mono mt-1 block text-[10px] uppercase tracking-[0.22em] text-solar-500">
                      {item.type} · {item.timeEstimate} · {item.track}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* ALL PHASES PROGRESS ────────────────────────────────────────── */}
      <section
        aria-label="Per-phase progress"
        data-testid="phases-progress"
        className="mt-12"
      >
        <div className="border-b border-solar-200 pb-3">
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
            All phases
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight text-solar-800">
            The full arc, at a glance.
          </h2>
        </div>
        <ul className="mt-5 space-y-4">
          {byPhase.map(({ phase, pct, summary }) => (
            <li
              key={phase}
              data-testid={`phase-row-${phase}`}
              className="rounded-sm border border-solar-200 bg-solar-50 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                    Phase {phase}
                  </p>
                  <p className="mt-0.5 font-serif text-[16px] leading-snug text-solar-800">
                    {PHASE_META[phase].title}
                  </p>
                </div>
                <span className="mono shrink-0 text-[11px] text-solar-600">
                  <span className="text-coral-600">{summary.done}</span>
                  <span className="text-solar-500">
                    {" "}
                    / {summary.total}
                  </span>{" "}
                  <span className="uppercase tracking-[0.2em] text-solar-500">
                    done
                  </span>
                </span>
              </div>
              <ProgressBar pct={pct} testId={`phase-progress-${phase}`} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Widgets
 * ────────────────────────────────────────────────────────────────────── */

function CurrentPhaseCard({
  phase,
  pct,
  summary,
  hydrated,
}: {
  phase: Phase;
  pct: number;
  summary: { done: number; total: number; inprog: number; pending: number };
  hydrated: boolean;
}) {
  const meta = PHASE_META[phase];
  return (
    <article
      data-testid="current-phase-card"
      aria-label="Current phase"
      className="flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Current phase
        </p>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Phase {phase} of 5
        </span>
      </div>
      <h2 className="mt-3 font-serif text-2xl leading-tight text-solar-800">
        {meta.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-solar-600">
        {meta.blurb}
      </p>
      <div className="mt-5">
        <ProgressBar pct={pct} testId="current-phase-progress" large />
        <p className="mono mt-2 text-[11px] text-solar-600">
          <span className="text-coral-600">
            {hydrated ? summary.done : 0}
          </span>
          <span className="text-solar-500">
            {" "}
            / {summary.total} done · {summary.inprog} in progress ·{" "}
            {summary.pending} pending
          </span>
        </p>
      </div>
    </article>
  );
}

function ContinueCard({
  item,
  hydrated,
}: {
  item:
    | {
        id: string;
        title: string;
        type: string;
        timeEstimate: string;
        phase: Phase;
      }
    | null;
  hydrated: boolean;
}) {
  if (!item) {
    return (
      <article
        data-testid="continue-card"
        className="flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
      >
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Continue
        </p>
        <h2 className="mt-3 font-serif text-2xl leading-tight text-solar-800">
          Pick your first item.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-solar-600">
          Nothing is in progress yet. Open the curriculum and start with
          Phase 1, Chapter 1.
        </p>
        <div className="mt-5">
          <Link
            href="/curriculum"
            data-testid="continue-link"
            className="mono inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
          >
            Continue
            <span aria-hidden>→</span>
          </Link>
        </div>
      </article>
    );
  }
  const href = `/curriculum?item=${encodeURIComponent(item.id)}`;
  return (
    <article
      data-testid="continue-card"
      className="flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Continue
        </p>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Phase {item.phase}
        </span>
      </div>
      <h2 className="mt-3 font-serif text-2xl leading-tight text-solar-800">
        {item.title}
      </h2>
      <p className="mono mt-1 text-[11px] uppercase tracking-[0.22em] text-solar-500">
        {item.type} · {item.timeEstimate}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          {hydrated ? "Most recently touched" : "Loading…"}
        </span>
        <Link
          href={href}
          data-testid="continue-link"
          data-item-id={item.id}
          className="mono inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
        >
          Continue
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

function DueTodayCard({
  count,
  hydrated,
}: {
  count: number;
  hydrated: boolean;
}) {
  const empty = hydrated && count === 0;
  return (
    <article
      data-testid="due-today-card"
      className="flex flex-col justify-between rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
    >
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Due today
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <span
            data-testid="due-today-count"
            className="font-serif text-5xl leading-none text-solar-800"
          >
            {hydrated ? count : "—"}
          </span>
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-500">
            {count === 1 ? "card" : "cards"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-solar-600">
          {empty
            ? "The SM-2 scheduler has nothing queued. Come back after new cards graduate their interval."
            : "The spaced-repetition scheduler has these queued for you. 5 minutes is enough."}
        </p>
      </div>
      <div className="mt-5">
        <Link
          href="/flashcards"
          data-testid="due-today-cta"
          className="mono inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
        >
          {empty
            ? "Open deck"
            : count > 0
              ? `Review ${count} cards`
              : "Due today"}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

function StreakCard({
  slots,
  count,
  run,
  hydrated,
}: {
  slots: Array<{ date: string; active: boolean }>;
  count: number;
  run: number;
  hydrated: boolean;
}) {
  return (
    <article
      data-testid="streak-card"
      aria-label="Weekly streak"
      className="flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Streak
        </p>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Last 7 days
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-serif text-4xl leading-none text-solar-800">
          {hydrated ? run : 0}
        </span>
        <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-500">
          day{run === 1 ? "" : "s"} in a row
        </span>
      </div>
      <ul
        data-testid="streak-dots"
        className="mt-5 flex items-center gap-2"
        aria-label={`Weekly streak — ${count} of 7 days active`}
      >
        {slots.map((slot, idx) => (
          <li
            key={slot.date}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              data-testid={`streak-dot-${idx}`}
              data-active={hydrated && slot.active ? "true" : "false"}
              data-date={slot.date}
              aria-label={`${slot.date}: ${slot.active ? "active" : "idle"}`}
              className="inline-block h-4 w-4 rounded-full transition-colors"
              style={{
                backgroundColor:
                  hydrated && slot.active ? "#D97757" : "#E4DDC8",
                border:
                  idx === slots.length - 1
                    ? "2px solid #586E75"
                    : "1px solid #D4CEBD",
              }}
            />
            <span className="mono text-[9px] uppercase tracking-[0.18em] text-solar-500">
              {shortDayLabel(slot.date, idx === slots.length - 1)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-solar-600">
        A day lights up when you mark one curriculum item{" "}
        <span className="text-solar-700">done</span> or review{" "}
        <span className="text-solar-700">≥ 5 flashcards</span>.
      </p>
    </article>
  );
}

function ProgressBar({
  pct,
  testId,
  large,
}: {
  pct: number;
  testId?: string;
  large?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-testid={testId}
      data-pct={clamped}
      className={
        "overflow-hidden rounded-sm bg-solar-200 " + (large ? "h-3" : "h-2")
      }
    >
      <div
        className="h-full bg-coral-500 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Format an ISO date as a short 2-letter weekday label, or "TODAY" for the
 *  last slot so the right edge of the 7-dot row always reads its anchor. */
function shortDayLabel(iso: string, isToday: boolean): string {
  if (isToday) return "TODAY";
  const d = new Date(`${iso}T00:00:00`);
  return ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][d.getDay()] ?? "";
}
