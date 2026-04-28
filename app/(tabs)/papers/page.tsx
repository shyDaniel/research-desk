// app/(tabs)/papers/page.tsx
//
// Papers tab index. Renders every authored paper from src/data/papers.ts
// grouped by track (RLHF primary, MLE-Fundamentals supporting), each card
// linking to /papers/[slug] where the editorial summary and pointed
// comprehension questions live. No client state here — the per-paper page
// handles persisted answers.

import Link from "next/link";

import { PAPERS, type Paper } from "@/data/papers";

export default function PapersPage() {
  const byTrack = {
    RLHF: PAPERS.filter((p) => p.track === "RLHF"),
    "MLE-Fundamentals": PAPERS.filter((p) => p.track === "MLE-Fundamentals"),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Papers
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {PAPERS.length} papers, read on purpose.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          Every paper here is load-bearing for the OpenAI / Anthropic
          post-training path. Click one for a short editorial summary
          explaining why it matters, plus pointed comprehension questions
          with a persisted answer textarea. The{" "}
          <span className="mono text-sol-blue">Reveal my answer</span>{" "}
          button stays disabled until you&rsquo;ve typed at least 40
          characters — no passive reading.
        </p>
      </header>

      <section className="mt-10" data-testid="papers-track-rlhf">
        <TrackHeader
          label="Primary track — RLHF"
          description="InstructGPT through DeepSeek-R1. The canonical RLHF / preference-optimisation / reasoning-RL arc."
          count={byTrack.RLHF.length}
        />
        <PaperGrid papers={byTrack.RLHF} />
      </section>

      <section className="mt-12" data-testid="papers-track-mle">
        <TrackHeader
          label="Supporting track — MLE fundamentals"
          description="Distributed training and GPU systems papers that you need in order to read RLHF work critically."
          count={byTrack["MLE-Fundamentals"].length}
        />
        <PaperGrid papers={byTrack["MLE-Fundamentals"]} />
      </section>
    </div>
  );
}

function TrackHeader({
  label,
  description,
  count,
}: {
  label: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-solar-200 pb-3">
      <div>
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          {label}
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-solar-600">
          {description}
        </p>
      </div>
      <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-500">
        {count} {count === 1 ? "paper" : "papers"}
      </span>
    </div>
  );
}

function PaperGrid({ papers }: { papers: ReadonlyArray<Paper> }) {
  return (
    <ul
      className="mt-5 grid gap-4 sm:grid-cols-2"
      data-testid="papers-grid"
    >
      {papers.map((p) => (
        <li key={p.slug}>
          <PaperCard paper={p} />
        </li>
      ))}
    </ul>
  );
}

function PaperCard({ paper }: { paper: Paper }) {
  // Compact the summary for the card — first sentence, clipped at 180 chars.
  const excerpt = firstSentence(paper.summary, 180);
  return (
    <Link
      href={`/papers/${paper.slug}`}
      data-testid="paper-card"
      data-slug={paper.slug}
      className="group block h-full rounded-sm border border-solar-200 bg-solar-100 p-5 shadow-card transition hover:border-coral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
    >
      <div className="flex items-center gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.24em] text-solar-500">
          {paper.year} · {paper.venue}
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.24em] text-sol-blue">
          {paper.questions.length} questions
        </span>
      </div>
      <h3 className="mt-3 font-serif text-lg leading-snug text-solar-800 group-hover:text-coral-600">
        {paper.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-solar-600">
        {excerpt}
      </p>
      <p className="mt-4 mono text-[11px] uppercase tracking-[0.2em] text-coral-500 opacity-0 transition group-hover:opacity-100">
        Read &rarr;
      </p>
    </Link>
  );
}

function firstSentence(s: string, max: number): string {
  const trimmed = s.trim();
  const dot = trimmed.indexOf(". ");
  const slice =
    dot > 40 && dot < max ? trimmed.slice(0, dot + 1) : trimmed.slice(0, max);
  return slice.length < trimmed.length && !slice.endsWith(".")
    ? `${slice.trimEnd()}…`
    : slice;
}
