import Link from "next/link";
import { notFound } from "next/navigation";

import { PAPERS, type Paper } from "@/data/papers";
import { parseTrackSlug, slugToTrack, TRACK_META } from "@/lib/track";

interface PapersPageProps {
  params: Promise<{ track: string }>;
}

export default async function PapersPage({ params }: PapersPageProps) {
  const { track: rawTrack } = await params;
  const slug = parseTrackSlug(rawTrack);
  if (!slug) notFound();
  const track = slugToTrack(slug);
  const meta = TRACK_META[slug];
  const papers = PAPERS.filter((p) => p.track === track);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          {meta.label} · Papers
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {papers.length} {papers.length === 1 ? "paper" : "papers"}, read on purpose.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          Each paper here is load-bearing. Click one for an editorial summary explaining what to
          take away, plus pointed comprehension questions with persisted answers. The{" "}
          <span className="mono text-sol-blue">Reveal</span> button stays disabled until your
          answer reaches 40 characters — passive reading doesn&rsquo;t count.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="papers-grid">
        {papers.map((p) => (
          <li key={p.slug}>
            <PaperCard paper={p} trackSlug={slug} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaperCard({ paper, trackSlug }: { paper: Paper; trackSlug: string }) {
  const excerpt = firstSentence(paper.summary, 180);
  return (
    <Link
      href={`/${trackSlug}/papers/${paper.slug}`}
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
      <p className="mt-2 text-[13px] leading-relaxed text-solar-600">{excerpt}</p>
      <p className="mt-4 mono text-[11px] uppercase tracking-[0.2em] text-coral-500 opacity-0 transition group-hover:opacity-100">
        Read &rarr;
      </p>
    </Link>
  );
}

function firstSentence(s: string, max: number): string {
  const trimmed = s.trim();
  const dot = trimmed.indexOf(". ");
  const slice = dot > 40 && dot < max ? trimmed.slice(0, dot + 1) : trimmed.slice(0, max);
  return slice.length < trimmed.length && !slice.endsWith(".")
    ? `${slice.trimEnd()}…`
    : slice;
}
