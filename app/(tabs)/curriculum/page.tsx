"use client";

// app/(tabs)/curriculum/page.tsx
//
// Curriculum tab — the home page per FINAL_GOAL.md §5. Renders all 55+
// authored items from src/data/curriculum.ts, grouped by phase, with a
// filter bar (phase / track / type / state) and a per-row tristate progress
// checkbox persisted to research-desk:v1:progress.
//
// Per FINAL_GOAL.md §3 Page 1 and §5, this page is sidesheet/drawer-free:
// every piece of per-item information (focus note, canonical URL,
// prerequisites, per-item notes, state pill, cycle CTA) renders inline on
// the row itself. There is no modal, no overlay, no role="dialog" tied to
// any curriculum row.
//
// The Export / Import JSON buttons (FINAL_GOAL.md §2) live in a quiet
// footer at the bottom of this page — the Dashboard that used to host
// them was deleted in S-136.

import { useMemo } from "react";

import {
  applyFilters,
  CurriculumFilters,
  DEFAULT_FILTERS,
  type CurriculumFiltersValue,
} from "@/components/curriculum-filters";
import { CurriculumList } from "@/components/curriculum-list";
import { DataExportImport } from "@/components/data-export-import";
import { CURRICULUM } from "@/data/curriculum";
import { getProgress, summarize } from "@/lib/progress";
import { useCards } from "@/state/use-cards";
import { useItemNotes } from "@/state/use-item-notes";
import { useProgress } from "@/state/use-progress";
import { useState } from "react";

export default function CurriculumPage() {
  const { progress, hydrated, cycle } = useProgress();
  const { notes, setNote } = useItemNotes();
  const { todayDue, hydrated: cardsHydrated } = useCards();
  const [filters, setFilters] = useState<CurriculumFiltersValue>(DEFAULT_FILTERS);

  const progressFor = (id: string) => getProgress(progress, id);

  const shown = useMemo(
    () => applyFilters(CURRICULUM, filters, progressFor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, progress]
  );

  const totals = useMemo(
    () => summarize(progress, CURRICULUM.map((i) => i.id)),
    [progress]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Curriculum
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {CURRICULUM.length} items, five phases, one path.
        </h1>
        <p
          data-testid="curriculum-dashboard"
          className="mt-4 font-serif text-lg leading-relaxed text-solar-700"
        >
          <span data-testid="dashboard-done">
            <span className="text-coral-600">{totals.done}</span> of{" "}
            {totals.total} done
          </span>
          <span className="mx-3 text-solar-400" aria-hidden>
            ·
          </span>
          <span data-testid="dashboard-cards-due">
            <span className="text-coral-600">
              {cardsHydrated ? todayDue : 0}
            </span>{" "}
            cards due today
          </span>
        </p>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-solar-500">
          Everything you need is on this page. Cycle the checkbox to mark an
          item in progress or done — progress persists locally across sessions.
        </p>
      </header>

      <div className="mt-6">
        <CurriculumFilters
          value={filters}
          onChange={setFilters}
          counts={{ total: CURRICULUM.length, shown: shown.length }}
        />
      </div>

      <CurriculumList
        items={shown}
        progress={progress}
        hydrated={hydrated}
        onCycle={cycle}
        notes={notes}
        onNoteChange={setNote}
      />

      <footer className="mt-16 border-t border-solar-200 pt-10">
        <DataExportImport />
      </footer>
    </div>
  );
}
