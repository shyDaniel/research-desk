"use client";

// app/(tabs)/papers/[slug]/paper-reader.tsx
//
// Client component rendering the per-paper reading surface: editorial
// summary up top, then a list of 5–7 pointed questions each with a
// persisted answer textarea and a "Reveal my answer" button. The reveal
// button is disabled until the user has typed ≥ REVEAL_THRESHOLD (40)
// non-whitespace-trimmed characters — the gate is enforced by the hook,
// the button mirrors the hook's `canReveal`.
//
// There are no canonical "correct answers" in this app (FINAL_GOAL §3.4:
// no LLM grading, user self-grades). "Reveal my answer" therefore shows
// the user their OWN typed answer re-rendered as read-only prose — the
// psychological point is forcing them to commit a draft before they
// consult the paper's actual text.

import Link from "next/link";
import { useState } from "react";

import type { Paper, PaperQuestion } from "@/data/papers";
import type { TrackSlug } from "@/lib/track";
import { REVEAL_THRESHOLD, usePaperAnswers } from "@/state/use-paper-answers";

export function PaperReader({ paper, trackSlug }: { paper: Paper; trackSlug: TrackSlug }) {
  const { getAnswer, canReveal, setAnswer, hydrated } = usePaperAnswers();

  return (
    <article className="mx-auto max-w-3xl" data-testid="paper-reader" data-slug={paper.slug}>
      <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
        <Link
          href={`/${trackSlug}/papers`}
          className="hover:text-coral-600"
          data-testid="back-to-papers"
        >
          ← Papers
        </Link>
      </p>

      <header className="mt-4 border-b border-solar-200 pb-6">
        <h1
          className="font-serif text-3xl leading-tight text-solar-800 sm:text-4xl"
          data-testid="paper-title"
        >
          {paper.title}
        </h1>
        <p className="mt-3 text-sm text-solar-600">
          <span className="mono text-solar-700">{paper.authors}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          <span className="mono uppercase tracking-[0.2em] text-solar-500">
            {paper.year} · {paper.venue}
          </span>
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            data-testid="paper-canonical-url"
            className="mono text-sol-blue underline decoration-sol-blue/40 underline-offset-4 hover:decoration-sol-blue"
          >
            {displayUrl(paper.url)}
          </a>
          <span className="mono uppercase tracking-[0.2em] text-coral-500">
            {paper.track === "RLHF" ? "RLHF" : "MLE-Fundamentals"}
          </span>
        </div>
      </header>

      <section className="mt-8">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
          Why this paper matters
        </p>
        <p
          className="mt-3 text-base leading-relaxed text-solar-700"
          data-testid="paper-summary"
        >
          {paper.summary}
        </p>
      </section>

      <section className="mt-10">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
          Pointed questions · {paper.questions.length}
        </p>
        <ol
          className="mt-4 space-y-8"
          data-testid="paper-questions"
        >
          {paper.questions.map((q, idx) => (
            <li key={q.id}>
              <QuestionBlock
                index={idx + 1}
                question={q}
                value={getAnswer(paper.slug, q.id)}
                canReveal={canReveal(paper.slug, q.id)}
                onChange={(v) => setAnswer(paper.slug, q.id, v)}
                hydrated={hydrated}
              />
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-12 border-t border-solar-200 pt-5 text-[12px] text-solar-500">
        <span className="mono uppercase tracking-[0.22em]">
          answers autosave · {REVEAL_THRESHOLD}-char reveal gate · self-graded
        </span>
      </footer>
    </article>
  );
}

function QuestionBlock({
  index,
  question,
  value,
  canReveal,
  onChange,
  hydrated,
}: {
  index: number;
  question: PaperQuestion;
  value: string;
  canReveal: boolean;
  onChange: (v: string) => void;
  hydrated: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const trimmedLen = value.trim().length;
  const remaining = Math.max(0, REVEAL_THRESHOLD - trimmedLen);

  // Auto-collapse the reveal panel if the user edits back below the gate.
  const showReveal = revealed && canReveal;

  return (
    <div
      className="rounded-sm border border-solar-200 bg-solar-100 p-5 shadow-card"
      data-testid="paper-question"
      data-qid={question.id}
    >
      <div className="flex items-baseline gap-3">
        <span className="mono text-[11px] uppercase tracking-[0.22em] text-coral-500">
          Q{index}
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          {question.id}
        </span>
      </div>
      <p className="mt-2 font-serif text-lg leading-snug text-solar-800">
        {question.prompt}
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Your answer to question {index}</span>
        <textarea
          data-testid="answer-textarea"
          data-qid={question.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder={
            hydrated
              ? "Draft your answer before revealing. 40+ characters unlocks the button."
              : "Loading saved answer…"
          }
          className="w-full resize-y rounded-sm border border-solar-200 bg-solar-50 p-3 font-serif text-[15px] leading-relaxed text-solar-800 placeholder:text-solar-500 focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-500/40"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span
          className="mono text-[11px] uppercase tracking-[0.22em] text-solar-500"
          data-testid="answer-char-count"
          data-count={trimmedLen}
        >
          {trimmedLen} chars
          {remaining > 0 ? ` · ${remaining} to unlock` : " · reveal unlocked"}
        </span>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          disabled={!canReveal}
          aria-disabled={!canReveal}
          data-testid="reveal-button"
          data-qid={question.id}
          data-can-reveal={canReveal ? "true" : "false"}
          data-revealed={showReveal ? "true" : "false"}
          className={
            canReveal
              ? "inline-flex items-center gap-2 rounded-sm bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition hover:bg-coral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
              : "inline-flex items-center gap-2 rounded-sm border border-solar-300 bg-solar-50 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-500 opacity-60"
          }
        >
          {showReveal ? "Hide my answer" : "Reveal my answer"}
        </button>
      </div>

      {showReveal && (
        <div
          className="mt-4 border-t border-solar-200 pt-4"
          data-testid="revealed-panel"
        >
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
            Your draft
          </p>
          <p className="mt-2 whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-solar-800">
            {value}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-solar-500">
            You committed this answer. Now open the paper and grade yourself
            against it — every gap you find is the thing to actually study.
          </p>
        </div>
      )}
    </div>
  );
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const tail = u.pathname === "/" ? "" : u.pathname;
    return `${u.host}${tail}`;
  } catch {
    return url;
  }
}
