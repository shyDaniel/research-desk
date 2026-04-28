"use client";

// app/(tabs)/curriculum/page.tsx
//
// Curriculum tab. Renders all 55+ authored items from src/data/curriculum.ts,
// grouped by phase, with a filter bar (phase / track / type / state) and
// per-row tristate progress checkboxes persisted to research-desk:v1:progress.
// Clicking a row opens a side-sheet with the focus note, canonical URL, and
// a per-item notes textarea that autosaves to research-desk:v1:item-notes.
//
// Deep-link: /curriculum?item=<id> opens the side-sheet for that item on
// mount. Used by the Dashboard's "Continue" card.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CurriculumDetailSheet } from "@/components/curriculum-detail-sheet";
import {
  applyFilters,
  CurriculumFilters,
  DEFAULT_FILTERS,
  type CurriculumFiltersValue,
} from "@/components/curriculum-filters";
import { CurriculumList } from "@/components/curriculum-list";
import { CURRICULUM } from "@/data/curriculum";
import { getProgress, summarize } from "@/lib/progress";
import { useItemNotes } from "@/state/use-item-notes";
import { useProgress } from "@/state/use-progress";

export default function CurriculumPage() {
  return (
    <Suspense fallback={<CurriculumShell />}>
      <CurriculumPageInner />
    </Suspense>
  );
}

function CurriculumPageInner() {
  const { progress, hydrated, cycle } = useProgress();
  const { notes, setNote } = useItemNotes();
  const [filters, setFilters] = useState<CurriculumFiltersValue>(DEFAULT_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  // Honor the ?item=<id> deep-link from the Dashboard's "Continue" block.
  // Runs once on mount so a refresh with the same URL re-opens the sheet,
  // and only opens if the id actually exists in the authored curriculum.
  const searchParams = useSearchParams();
  useEffect(() => {
    const requested = searchParams?.get("item");
    if (!requested) return;
    const exists = CURRICULUM.some((i) => i.id === requested);
    if (exists) setOpenId(requested);
    // Intentionally only reads on the initial search params so manual
    // closes don't fight with the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const openItem = openId
    ? CURRICULUM.find((i) => i.id === openId) ?? null
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Curriculum
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {CURRICULUM.length} items, five phases, one path.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          The reading order is meaningful. Cycle the checkbox to mark an item
          in progress or done — progress persists locally across browser
          sessions. Click a row title to open the side-sheet with the full
          focus note, the canonical URL, and a notebook for your thoughts on
          that item.
        </p>
        <div className="mt-5 flex flex-wrap gap-6 text-[12px]">
          <Stat label="Total" value={totals.total} />
          <Stat label="Done" value={totals.done} tone="done" />
          <Stat label="In progress" value={totals.inprog} tone="inprog" />
          <Stat label="Pending" value={totals.pending} tone="pending" />
        </div>
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
        onOpen={(id) => setOpenId(id)}
        itemNoteHas={(id) => {
          const v = notes[id];
          return typeof v === "string" && v.trim().length > 0;
        }}
      />

      <CurriculumDetailSheet
        item={openItem}
        progress={progress}
        noteValue={openItem ? notes[openItem.id] ?? "" : ""}
        onNoteChange={(value) => {
          if (openItem) setNote(openItem.id, value);
        }}
        onCycle={cycle}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

/** Render-on-suspend fallback — same chrome minus the interactive bits so
 *  the layout doesn't jump when the search-params promise resolves. */
function CurriculumShell() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Curriculum
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {CURRICULUM.length} items, five phases, one path.
        </h1>
      </header>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "done" | "inprog" | "pending";
}) {
  const color =
    tone === "done"
      ? "#859900"
      : tone === "inprog"
        ? "#C1603F"
        : tone === "pending"
          ? "#657B83"
          : "#586E75";
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="font-serif text-xl"
        style={{ color }}
        data-testid={`stat-${tone ?? "total"}`}
      >
        {value}
      </span>
      <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
        {label}
      </span>
    </div>
  );
}
