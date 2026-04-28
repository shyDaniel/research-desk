"use client";

// src/components/curriculum-list.tsx
//
// Phase-grouped list of curriculum items. Each row: a tristate checkbox
// (pending → inprog → done), the title + type badge + time estimate, the
// truncated focus note, and a "details" affordance that opens the side-
// sheet. The checkbox advances state; the row body opens the sheet.
//
// Rendered as <article> elements so keyboard + screen-reader users get a
// real landmark per item. The acceptance test specifically looks for ≥ 55
// of these as either <li> or <article>.

import type { CurriculumItem, Phase } from "@/data/types";
import { getProgress, type ProgressMap, type ProgressState } from "@/lib/progress";

const PHASE_META: Record<
  Phase,
  { label: string; subtitle: string }
> = {
  1: {
    label: "Phase 1 — Foundations",
    subtitle:
      "RL fundamentals, policy gradients, KL divergence, importance sampling. Before any RLHF paper.",
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
    label: "Phase 5 — Specialization & MLE infra",
    subtitle:
      "Tülu 3, ZeRO/FSDP, FlashAttention, eval harnesses, reward hacking. The stack that actually ships models.",
  },
};

interface CurriculumListProps {
  items: ReadonlyArray<CurriculumItem>;
  progress: ProgressMap;
  hydrated: boolean;
  onCycle: (itemId: string) => void;
  onOpen: (itemId: string) => void;
  itemNoteHas: (itemId: string) => boolean;
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
  progress,
  hydrated,
  onCycle,
  onOpen,
  itemNoteHas,
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
        const meta = PHASE_META[phase];
        const doneCount = groupItems.filter(
          (it) => getProgress(progress, it.id) === "done"
        ).length;
        return (
          <section key={phase} aria-labelledby={`phase-${phase}-heading`}>
            <header className="mb-4 flex items-end justify-between gap-4 border-b border-solar-200 pb-3">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
                  {meta.label}
                </p>
                <h2
                  id={`phase-${phase}-heading`}
                  className="mt-1 font-serif text-2xl leading-tight text-solar-800"
                >
                  {meta.subtitle}
                </h2>
              </div>
              <span className="mono shrink-0 text-[11px] text-solar-600">
                <span className="text-coral-600">{doneCount}</span>
                <span className="text-solar-500"> / {groupItems.length}</span>{" "}
                <span className="uppercase tracking-[0.2em] text-solar-500">done</span>
              </span>
            </header>

            <ul className="space-y-2">
              {groupItems.map((item) => (
                <CurriculumRow
                  key={item.id}
                  item={item}
                  state={getProgress(progress, item.id)}
                  hydrated={hydrated}
                  onCycle={onCycle}
                  onOpen={onOpen}
                  hasNote={itemNoteHas(item.id)}
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
  onOpen: (itemId: string) => void;
  hasNote: boolean;
}

function CurriculumRow({
  item,
  state,
  hydrated,
  onCycle,
  onOpen,
  hasNote,
}: RowProps) {
  const stateLabel =
    state === "done" ? "Done" : state === "inprog" ? "In progress" : "Pending";

  return (
    <li>
      <article
        data-testid="curriculum-row"
        data-state={state}
        className={
          "group flex gap-4 rounded-sm border bg-solar-50 px-4 py-3 transition-colors " +
          (state === "done"
            ? "border-solar-200 opacity-80"
            : "border-solar-200 hover:border-coral-400")
        }
      >
        <button
          type="button"
          data-testid={`row-checkbox-${item.id}`}
          aria-label={`Cycle progress for ${item.title}. Current: ${stateLabel}`}
          onClick={(e) => {
            e.stopPropagation();
            onCycle(item.id);
          }}
          className="mt-0.5 shrink-0"
        >
          <CheckboxIcon state={state} hydrated={hydrated} />
        </button>

        <button
          type="button"
          data-testid={`row-open-${item.id}`}
          onClick={() => onOpen(item.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className={
                "font-serif text-[17px] leading-snug " +
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
            {hasNote ? (
              <span
                data-testid={`row-note-dot-${item.id}`}
                className="mono text-[10px] uppercase tracking-[0.22em] text-coral-600"
                title="Has personal notes"
              >
                · notes
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-solar-600">
            {item.focusNote}
          </p>
        </button>
      </article>
    </li>
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
