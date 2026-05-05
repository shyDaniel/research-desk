"use client";

// src/components/curriculum-list.tsx
//
// Phase-grouped list of curriculum items. Per FINAL_GOAL.md §3 Page 1
// ("focus note inline — the focus note is the point, show it") and §5
// ("No sidesheets or drawers anywhere. Everything inline."), every row
// renders the full focus note, the canonical URL as a visible external
// link, any prerequisites, a per-item notes textarea that autosaves, a
// state pill, and a cycle CTA — all without a modal, drawer, or overlay.
//
// Rendered as <article> elements so keyboard + screen-reader users get a
// real landmark per item. The URL opens in a new tab per FINAL_GOAL §5
// ("Links open in a new tab").

import type { CurriculumItem, Phase, Track } from "@/data/types";
import {
  getProgress,
  nextState,
  type ProgressMap,
  type ProgressState,
} from "@/lib/progress";

type PhaseMeta = { label: string; subtitle: string };

const RLHF_PHASE_META: Record<Phase, PhaseMeta> = {
  1: {
    label: "Phase 1 — Foundations",
    subtitle:
      "RL fundamentals, policy gradients, KL divergence, importance sampling, LM internals. Before any RLHF paper.",
  },
  2: {
    label: "Phase 2 — PPO & Reward Modeling",
    subtitle:
      "PPO, the clipped surrogate, Bradley-Terry RMs, length bias, Christiano'17. First end-to-end RLHF build.",
  },
  3: {
    label: "Phase 3 — DPO family + Constitutional AI",
    subtitle:
      "DPO derivation, IPO/KTO/SimPO, CAI, RLAIF, self-rewarding. PPO's offline cousin and Anthropic's recipe.",
  },
  4: {
    label: "Phase 4 — Reasoning RL",
    subtitle:
      "PRMs vs ORMs, DeepSeek-R1, GRPO, rule-based verifiable rewards. The 2024–25 reasoning shift.",
  },
  5: {
    label: "Phase 5 — Specialization & end-to-end",
    subtitle:
      "Tülu 3, eval harnesses, reward hacking, RLHF for safety. The stack that actually ships models.",
  },
};

const MLE_PHASE_META: Record<Phase, PhaseMeta> = {
  1: { label: "", subtitle: "" },
  2: { label: "", subtitle: "" },
  3: { label: "", subtitle: "" },
  4: { label: "", subtitle: "" },
  5: {
    label: "MLE Fundamentals",
    subtitle:
      "Distributed training, GPU kernels, and eval infra — the small set an RE must know to read RLHF work critically.",
  },
};

function phaseMetaFor(track: Track, phase: Phase): PhaseMeta {
  return track === "RLHF" ? RLHF_PHASE_META[phase] : MLE_PHASE_META[phase];
}

interface CurriculumListProps {
  items: ReadonlyArray<CurriculumItem>;
  track: Track;
  progress: ProgressMap;
  hydrated: boolean;
  onCycle: (itemId: string) => void;
  notes: Record<string, string>;
  onNoteChange: (itemId: string, value: string) => void;
}

function groupByPhase(
  items: ReadonlyArray<CurriculumItem>
): Array<{ phase: Phase; items: CurriculumItem[] }> {
  const buckets = new Map<Phase, CurriculumItem[]>();
  for (const it of items) {
    const arr = buckets.get(it.phase) ?? [];
    arr.push(it);
    buckets.set(it.phase, arr);
  }
  const phases: Phase[] = [1, 2, 3, 4, 5];
  return phases
    .map((phase) => ({ phase, items: buckets.get(phase) ?? [] }))
    .filter((g) => g.items.length > 0);
}

export function CurriculumList({
  items,
  track,
  progress,
  hydrated,
  onCycle,
  notes,
  onNoteChange,
}: CurriculumListProps) {
  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-sm border border-solar-200 bg-solar-100/50 px-6 py-12 text-center">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
          Empty match
        </p>
        <p className="mt-2 text-sm text-solar-600">
          No items match the active filters. Widen them or reset to All.
        </p>
      </div>
    );
  }

  const groups = groupByPhase(items);

  return (
    <div className="mt-6 space-y-10">
      {groups.map(({ phase, items: groupItems }) => {
        const meta = phaseMetaFor(track, phase);
        const doneCount = groupItems.filter(
          (it) => getProgress(progress, it.id) === "done"
        ).length;
        return (
          <section key={phase} aria-labelledby={`phase-${phase}-heading`}>
            <header className="mb-4 flex items-end justify-between gap-4 border-b border-solar-200 pb-3">
              <div>
                {meta.label ? (
                  <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
                    {meta.label}
                  </p>
                ) : null}
                {meta.subtitle ? (
                  <h2
                    id={`phase-${phase}-heading`}
                    className="mt-1 font-serif text-2xl leading-tight text-solar-800"
                  >
                    {meta.subtitle}
                  </h2>
                ) : (
                  <h2 id={`phase-${phase}-heading`} className="sr-only">
                    Items
                  </h2>
                )}
              </div>
              <span className="mono shrink-0 text-[11px] text-solar-600">
                <span className="text-coral-600">{doneCount}</span>
                <span className="text-solar-500"> / {groupItems.length}</span>{" "}
                <span className="uppercase tracking-[0.2em] text-solar-500">done</span>
              </span>
            </header>

            <ul className="space-y-4">
              {groupItems.map((item) => (
                <CurriculumRow
                  key={item.id}
                  item={item}
                  state={getProgress(progress, item.id)}
                  hydrated={hydrated}
                  onCycle={onCycle}
                  noteValue={notes[item.id] ?? ""}
                  onNoteChange={onNoteChange}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

interface RowProps {
  item: CurriculumItem;
  state: ProgressState;
  hydrated: boolean;
  onCycle: (itemId: string) => void;
  noteValue: string;
  onNoteChange: (itemId: string, value: string) => void;
}

function CurriculumRow({
  item,
  state,
  hydrated,
  onCycle,
  noteValue,
  onNoteChange,
}: RowProps) {
  const stateLabel =
    state === "done" ? "Done" : state === "inprog" ? "In progress" : "Pending";
  const cycleLabel = (() => {
    const n = nextState(state);
    return n === "done" ? "Mark done" : n === "inprog" ? "Start" : "Reset";
  })();

  return (
    <li>
      <article
        data-testid="curriculum-row"
        data-item-id={item.id}
        data-state={state}
        className={
          "rounded-sm border bg-solar-50 px-5 py-4 transition-colors " +
          (state === "done"
            ? "border-solar-200 opacity-90"
            : "border-solar-200 hover:border-coral-400")
        }
      >
        <div className="flex gap-4">
          <button
            type="button"
            data-testid={`row-checkbox-${item.id}`}
            aria-label={`Cycle progress for ${item.title}. Current: ${stateLabel}`}
            onClick={() => onCycle(item.id)}
            className="mt-1 shrink-0"
          >
            <CheckboxIcon state={state} hydrated={hydrated} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3
                data-testid={`row-title-${item.id}`}
                className={
                  "font-serif text-[18px] leading-snug " +
                  (state === "done"
                    ? "text-solar-600 line-through decoration-solar-400"
                    : "text-solar-800")
                }
              >
                {item.title}
              </h3>
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                {item.type} · {item.timeEstimate}
              </span>
              {item.track === "MLE-Fundamentals" ? (
                <span className="mono rounded-sm border border-solar-300 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.22em] text-solar-600">
                  MLE
                </span>
              ) : null}
              <StatePill state={state} />
            </div>

            <p
              data-testid={`row-focus-note-${item.id}`}
              className="mt-2 text-[14px] leading-relaxed text-solar-700"
            >
              {item.focusNote}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                data-testid={`row-url-${item.id}`}
                className="mono break-all text-[12px] text-coral-600 underline decoration-coral-300 underline-offset-2 hover:decoration-coral-500"
              >
                {item.url}
              </a>
              {item.prerequisites.length > 0 ? (
                <span className="mono inline-flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-solar-500">
                  <span>prereq</span>
                  {item.prerequisites.map((id) => (
                    <span
                      key={id}
                      className="rounded-sm border border-solar-200 bg-solar-100/60 px-1.5 py-[1px] text-[10px] tracking-normal text-solar-700"
                    >
                      {id}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex items-start gap-3">
              <label
                htmlFor={`row-notes-${item.id}`}
                className="mono shrink-0 pt-2 text-[10px] uppercase tracking-[0.22em] text-solar-500"
              >
                Notes
              </label>
              <textarea
                id={`row-notes-${item.id}`}
                data-testid={`row-notes-${item.id}`}
                value={noteValue}
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                placeholder="What clicked, what didn't, derivations to revisit. Autosaves."
                rows={2}
                className="min-h-[2.5rem] w-full resize-y rounded-sm border border-solar-200 bg-solar-50 px-3 py-1.5 text-[13px] leading-relaxed text-solar-800 placeholder:text-solar-400 focus:border-coral-500 focus:outline-none"
              />
              <button
                type="button"
                data-testid={`row-cycle-${item.id}`}
                onClick={() => onCycle(item.id)}
                className="mono shrink-0 self-start rounded-sm border border-coral-500 bg-coral-500 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
              >
                {cycleLabel}
              </button>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function StatePill({ state }: { state: ProgressState }) {
  const map: Record<
    ProgressState,
    { label: string; bg: string; color: string; border: string }
  > = {
    pending: {
      label: "Pending",
      bg: "#FDF6E3",
      color: "#657B83",
      border: "#E4DDC8",
    },
    inprog: {
      label: "In progress",
      bg: "#FBEDE5",
      color: "#C1603F",
      border: "#ECB79A",
    },
    done: {
      label: "Done",
      bg: "#F0F2D7",
      color: "#556B00",
      border: "#C7CF86",
    },
  };
  const v = map[state];
  return (
    <span
      data-testid="row-state-pill"
      data-state={state}
      className="mono rounded-sm px-1.5 py-[1px] text-[9px] uppercase tracking-[0.22em]"
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
    >
      {v.label}
    </span>
  );
}

function CheckboxIcon({
  state,
  hydrated,
}: {
  state: ProgressState;
  hydrated: boolean;
}) {
  // Pre-hydration we render a placeholder with the server-default ("pending")
  // so we don't get a flash of mismatched state. Once hydrated, real state
  // paints via the regular branches below.
  if (!hydrated && state !== "pending") {
    state = "pending";
  }

  const base =
    "flex h-5 w-5 items-center justify-center rounded-sm border text-[11px] transition-colors ";
  if (state === "done") {
    return (
      <span
        aria-hidden
        data-icon="done"
        className={
          base +
          "border-[var(--done,theme(colors.sol.green))] bg-[var(--done,theme(colors.sol.green))] text-solar-50"
        }
        style={{ borderColor: "#859900", backgroundColor: "#859900", color: "#FDF6E3" }}
      >
        ✓
      </span>
    );
  }
  if (state === "inprog") {
    return (
      <span
        aria-hidden
        data-icon="inprog"
        className={base + "border-coral-500 bg-coral-500/15 text-coral-600"}
      >
        ▣
      </span>
    );
  }
  return (
    <span
      aria-hidden
      data-icon="pending"
      className={base + "border-solar-300 bg-solar-50 text-transparent group-hover:border-coral-400"}
    >
      ·
    </span>
  );
}
