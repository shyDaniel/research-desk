"use client";

import { use, useMemo } from "react";
import { notFound } from "next/navigation";

import { CurriculumList } from "@/components/curriculum-list";
import { CURRICULUM } from "@/data/curriculum";
import { summarize } from "@/lib/progress";
import { parseTrackSlug, slugToTrack, TRACK_META } from "@/lib/track";
import { useItemNotes } from "@/state/use-item-notes";
import { useProgress } from "@/state/use-progress";

interface CurriculumPageProps {
  params: Promise<{ track: string }>;
}

export default function CurriculumPage({ params }: CurriculumPageProps) {
  const { track: rawTrack } = use(params);
  const slug = parseTrackSlug(rawTrack);
  if (!slug) notFound();
  const track = slugToTrack(slug);
  const meta = TRACK_META[slug];

  const { progress, hydrated, cycle } = useProgress();
  const { notes, setNote } = useItemNotes();

  const items = useMemo(() => CURRICULUM.filter((it) => it.track === track), [track]);
  const totals = useMemo(() => summarize(progress, items.map((i) => i.id)), [progress, items]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          {meta.label} · Curriculum
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {items.length} items, {meta.tagline.toLowerCase().replace(/\.$/, "")}.
        </h1>
        <p
          data-testid="curriculum-dashboard"
          className="mt-4 font-serif text-lg leading-relaxed text-solar-700"
        >
          <span data-testid="dashboard-done">
            <span className="text-coral-600">{totals.done}</span> of {totals.total} done
          </span>
        </p>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-solar-500">
          A guided path. Each row pairs a canonical source with a short note on what to actually
          look for. Cycle the checkbox to mark progress; per-row notes autosave locally.
        </p>
      </header>

      <CurriculumList
        items={items}
        progress={progress}
        hydrated={hydrated}
        onCycle={cycle}
        notes={notes}
        onNoteChange={setNote}
      />
    </div>
  );
}
