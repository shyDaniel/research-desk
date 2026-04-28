"use client";

// src/components/curriculum-filters.tsx
//
// The filter bar on /curriculum. Four dimensions per FINAL_GOAL.md §3.2:
// phase, track, type, completion state. All filters are additive (AND).
// Rendered as a single row of chip-style select groups so the page keeps
// its editorial feel — no dropdowns, no ornate UI.

import type {
  CurriculumType,
  Phase,
  Track,
} from "@/data/types";
import type { ProgressState } from "@/lib/progress";

export type StateFilter = ProgressState | "all";
export type PhaseFilter = Phase | "all";
export type TrackFilter = Track | "all";
export type TypeFilter = CurriculumType | "all";

export interface CurriculumFiltersValue {
  phase: PhaseFilter;
  track: TrackFilter;
  type: TypeFilter;
  state: StateFilter;
}

export const DEFAULT_FILTERS: CurriculumFiltersValue = {
  phase: "all",
  track: "all",
  type: "all",
  state: "all",
};

const PHASE_LABELS: Record<Phase, string> = {
  1: "Foundations",
  2: "PPO + RM",
  3: "DPO + CAI",
  4: "Reasoning",
  5: "End-to-end",
};

interface FilterGroupProps<T extends string | number> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (next: T) => void;
  testId?: string;
}

function FilterGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  testId,
}: FilterGroupProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isActive}
              className={
                "rounded-sm border px-2.5 py-1 text-[12px] transition-colors " +
                (isActive
                  ? "border-coral-500 bg-coral-500 text-solar-50"
                  : "border-solar-200 bg-solar-50 text-solar-700 hover:border-coral-400 hover:text-coral-600")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CurriculumFilters({
  value,
  onChange,
  counts,
}: {
  value: CurriculumFiltersValue;
  onChange: (next: CurriculumFiltersValue) => void;
  counts: { total: number; shown: number };
}) {
  const patch = (delta: Partial<CurriculumFiltersValue>) =>
    onChange({ ...value, ...delta });

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-solar-200 bg-solar-100/60 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.28em] text-solar-600">
          Filters
        </span>
        <span className="mono text-[11px] text-solar-600">
          <span className="text-coral-600">{counts.shown}</span>
          <span className="text-solar-500"> / {counts.total}</span>{" "}
          <span className="uppercase tracking-[0.2em] text-solar-500">shown</span>
        </span>
      </div>

      <FilterGroup<PhaseFilter>
        label="Phase"
        value={value.phase}
        testId="filter-phase"
        onChange={(v) => patch({ phase: v })}
        options={[
          { value: "all", label: "All" },
          { value: 1, label: "P1 · " + PHASE_LABELS[1] },
          { value: 2, label: "P2 · " + PHASE_LABELS[2] },
          { value: 3, label: "P3 · " + PHASE_LABELS[3] },
          { value: 4, label: "P4 · " + PHASE_LABELS[4] },
          { value: 5, label: "P5 · " + PHASE_LABELS[5] },
        ]}
      />

      <FilterGroup<TrackFilter>
        label="Track"
        value={value.track}
        testId="filter-track"
        onChange={(v) => patch({ track: v })}
        options={[
          { value: "all", label: "All" },
          { value: "RLHF", label: "RLHF" },
          { value: "MLE-Fundamentals", label: "MLE-Fundamentals" },
        ]}
      />

      <FilterGroup<TypeFilter>
        label="Type"
        value={value.type}
        testId="filter-type"
        onChange={(v) => patch({ type: v })}
        options={[
          { value: "all", label: "All" },
          { value: "Paper", label: "Paper" },
          { value: "Book chapter", label: "Book" },
          { value: "Blog post", label: "Blog" },
          { value: "Video", label: "Video" },
          { value: "Code project", label: "Code" },
          { value: "Tutorial", label: "Tutorial" },
        ]}
      />

      <FilterGroup<StateFilter>
        label="State"
        value={value.state}
        testId="filter-state"
        onChange={(v) => patch({ state: v })}
        options={[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "inprog", label: "In progress" },
          { value: "done", label: "Done" },
        ]}
      />
    </div>
  );
}

export function applyFilters<
  T extends {
    phase: Phase;
    track: Track;
    type: CurriculumType;
    id: string;
  }
>(
  items: ReadonlyArray<T>,
  filters: CurriculumFiltersValue,
  progressFor: (id: string) => ProgressState
): T[] {
  return items.filter((item) => {
    if (filters.phase !== "all" && item.phase !== filters.phase) return false;
    if (filters.track !== "all" && item.track !== filters.track) return false;
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.state !== "all" && progressFor(item.id) !== filters.state)
      return false;
    return true;
  });
}
