"use client";

// src/components/curriculum-detail-sheet.tsx
//
// Side-sheet (right-hand panel) shown when a curriculum row's title area
// is clicked. Surfaces: full focusNote, canonical URL (as an external
// link with rel=noreferrer), a per-item free-text notes textarea that
// autosaves on each keystroke, and a tristate checkbox mirroring the
// list row so the user doesn't have to close the sheet to mark progress.
//
// Accessibility: role=dialog, aria-modal, Escape closes, focus goes to
// the notes textarea on open, focus returns to the row on close (handled
// by the caller via onClose).

import { useEffect, useRef } from "react";

import type { CurriculumItem } from "@/data/types";
import {
  getProgress,
  nextState,
  type ProgressMap,
  type ProgressState,
} from "@/lib/progress";

interface CurriculumDetailSheetProps {
  item: CurriculumItem | null;
  progress: ProgressMap;
  noteValue: string;
  onNoteChange: (value: string) => void;
  onCycle: (itemId: string) => void;
  onClose: () => void;
}

export function CurriculumDetailSheet({
  item,
  progress,
  noteValue,
  onNoteChange,
  onCycle,
  onClose,
}: CurriculumDetailSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Escape closes. Focus the notes textarea when the sheet opens.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Defer so the dialog element exists before we try to focus into it.
    const raf = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(raf);
    };
  }, [item, onClose]);

  if (!item) return null;

  const state = getProgress(progress, item.id);
  const stateLabel =
    state === "done" ? "Done" : state === "inprog" ? "In progress" : "Pending";
  const nextLabel = (() => {
    const n = nextState(state);
    return n === "done" ? "Mark done" : n === "inprog" ? "Start" : "Reset";
  })();

  return (
    <div
      data-testid="detail-backdrop"
      className="fixed inset-0 z-40 flex justify-end bg-solar-900/10 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        data-testid="detail-sheet"
        className="flex h-full w-full max-w-[520px] flex-col border-l border-solar-200 bg-solar-50 shadow-card"
      >
        <header className="flex items-start justify-between gap-4 border-b border-solar-200 px-6 py-5">
          <div className="min-w-0">
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
              Phase {item.phase} · {item.track} · {item.type}
            </p>
            <h2
              id="detail-title"
              className="mt-2 font-serif text-2xl leading-tight text-solar-800"
            >
              {item.title}
            </h2>
            <p className="mt-1 mono text-[11px] uppercase tracking-[0.22em] text-solar-500">
              {item.timeEstimate} · id <span className="text-[var(--mono-ident,#268BD2)]" style={{ color: "#268BD2" }}>{item.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            data-testid="detail-close"
            className="mono rounded-sm border border-solar-200 px-2 py-1 text-[12px] text-solar-600 hover:border-coral-400 hover:text-coral-600"
          >
            Esc ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section>
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
              Focus note
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-solar-700">
              {item.focusNote}
            </p>
          </section>

          <section className="mt-6">
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
              Canonical link
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              data-testid="detail-url"
              className="mono mt-2 block break-all text-[13px] text-coral-600 underline decoration-coral-300 underline-offset-2 hover:decoration-coral-500"
            >
              {item.url}
            </a>
          </section>

          {item.prerequisites.length > 0 ? (
            <section className="mt-6">
              <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
                Prerequisites
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.prerequisites.map((id) => (
                  <li
                    key={id}
                    className="mono rounded-sm border border-solar-200 bg-solar-100/60 px-2 py-1 text-[11px] text-solar-700"
                  >
                    {id}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6">
            <div className="flex items-baseline justify-between gap-2">
              <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
                Personal notes
              </p>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                autosaves
              </p>
            </div>
            <textarea
              ref={textareaRef}
              data-testid="detail-notes"
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="What clicked, what didn't, derivations to revisit. Plain text or markdown — it's yours."
              className="mt-2 h-56 w-full resize-y rounded-sm border border-solar-200 bg-solar-50 px-3 py-2 text-[14px] leading-relaxed text-solar-800 placeholder:text-solar-400 focus:border-coral-500 focus:outline-none"
            />
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-solar-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
              State
            </span>
            <StatePill state={state} />
          </div>
          <button
            type="button"
            data-testid="detail-cycle"
            onClick={() => onCycle(item.id)}
            className="mono rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
          >
            {nextLabel}
          </button>
        </footer>

        <span className="sr-only">{stateLabel}</span>
      </aside>
    </div>
  );
}

function StatePill({ state }: { state: ProgressState }) {
  const map: Record<ProgressState, { label: string; bg: string; color: string; border: string }> = {
    pending: { label: "Pending", bg: "#FDF6E3", color: "#657B83", border: "#E4DDC8" },
    inprog: { label: "In progress", bg: "#FBEDE5", color: "#C1603F", border: "#ECB79A" },
    done: { label: "Done", bg: "#F0F2D7", color: "#556B00", border: "#C7CF86" },
  };
  const v = map[state];
  return (
    <span
      data-testid="detail-state-pill"
      data-state={state}
      className="mono rounded-sm px-2 py-1 text-[10px] uppercase tracking-[0.22em]"
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
    >
      {v.label}
    </span>
  );
}
