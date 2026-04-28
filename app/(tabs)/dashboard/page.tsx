import Link from "next/link";
import { CURRICULUM } from "@/data/curriculum";

/**
 * Dashboard shell. The full Dashboard per FINAL_GOAL.md §3.1 (current-phase
 * card, Continue block, due-flashcards CTA, per-phase progress, streak)
 * depends on the persistence layer, SM-2 scheduler, and flashcards data —
 * none of which exist yet. Rather than render empty rectangles, this page
 * surfaces the curriculum the product already has: per-phase item counts
 * and the first upcoming item of each phase. That is honest, useful on day
 * one, and gives every visitor a real reason to click back tomorrow.
 */

const PHASE_INFO: { title: string; blurb: string }[] = [
  {
    title: "Foundations",
    blurb: "Sutton & Barto, policy-gradient theorem, KL, importance sampling.",
  },
  {
    title: "PPO & Reward Modeling",
    blurb: "Clipped surrogate, GAE, Bradley-Terry RMs, length bias.",
  },
  {
    title: "DPO family & Constitutional AI",
    blurb: "DPO derivation, IPO, KTO, SimPO, CAI two-stage recipe.",
  },
  {
    title: "Reasoning RL",
    blurb: "PRMs vs ORMs, DeepSeek-R1, GRPO, verifiable rewards.",
  },
  {
    title: "Specialization & end-to-end",
    blurb: "Tülu 3 recipe, ZeRO/FSDP, FlashAttention, capstone.",
  },
];

export default function DashboardPage() {
  const byPhase = PHASE_INFO.map((info, idx) => {
    const phase = idx + 1;
    const items = CURRICULUM.filter((c) => c.phase === phase);
    return { phase, info, count: items.length, first: items[0] };
  });
  const totalItems = CURRICULUM.length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Dashboard
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          The desk, today.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          A quiet index of the curriculum ahead of you.{" "}
          <span className="text-solar-700">
            {totalItems} items across 5 phases
          </span>
          , in the order a mentor would hand them to you. Flashcards, papers,
          and notes are coming online in subsequent iterations.
        </p>
      </header>

      <section aria-label="Phases" className="mt-10 grid gap-4 sm:grid-cols-2">
        {byPhase.map(({ phase, info, count, first }) => (
          <article
            key={phase}
            className="flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card"
          >
            <div className="flex items-baseline justify-between">
              <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-600">
                Phase {phase}
              </p>
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                {count} items
              </span>
            </div>
            <h2 className="mt-3 font-serif text-xl leading-tight text-solar-800">
              {info.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-solar-600">
              {info.blurb}
            </p>
            {first ? (
              <div className="mt-5 border-t border-solar-200 pt-4">
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                  Opens with
                </p>
                <p className="mt-1.5 text-sm leading-snug text-solar-700">
                  {first.title}
                </p>
                <p className="mono mt-1 text-[11px] text-solar-500">
                  {first.type} · {first.timeEstimate}
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section
        aria-label="What works today"
        className="mt-12 rounded-sm border border-solar-200 bg-solar-100/60 p-6"
      >
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-600">
          Status
        </p>
        <h2 className="mt-3 font-serif text-2xl leading-tight text-solar-800">
          Curriculum is the first surface to come online.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-solar-600">
          The 55-item curriculum module is authored and link-verified. The
          Curriculum tab will render it with phase grouping, filters, and
          per-item focus notes. Flashcards (SM-2), Papers (editorial
          summaries), and Notes (markdown notebook) follow — each gated on the
          shared <code>research-desk:v1:*</code> localStorage layer.
        </p>
        <div className="mt-5">
          <Link
            href="/curriculum"
            className="inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-sm font-medium text-solar-50 shadow-card transition-colors hover:bg-coral-600 hover:border-coral-600 focus-visible:bg-coral-600"
          >
            Browse curriculum
            <span aria-hidden className="mono text-[10px] tracking-widest">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
