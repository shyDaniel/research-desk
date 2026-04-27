import Link from "next/link";

/**
 * Landing shell. This is the bootstrap iteration — the tabbed app
 * (Dashboard / Curriculum / Flashcards / Papers / Notes) lands in
 * subsequent iterations. Everything visible here is final-theme quality:
 * warm near-black, cream serif headings, amber accent, mono identifiers.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12 sm:px-10 sm:py-16">
      <header className="flex items-baseline justify-between border-b border-ink-700 pb-6">
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden
            className="h-2 w-2 translate-y-[-2px] rounded-full bg-amber-500"
          />
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-bone-500">
            research-desk / v0
          </span>
        </div>
        <span className="mono text-[11px] uppercase tracking-[0.22em] text-bone-500">
          post-training · rlhf
        </span>
      </header>

      <section className="mt-20 max-w-3xl">
        <p className="mono mb-6 text-[11px] uppercase tracking-[0.28em] text-amber-500">
          Personal learning OS
        </p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tightest text-bone-100 sm:text-7xl">
          A quiet desk for
          <br />
          <span className="italic text-bone-200">becoming a</span>
          <br />
          research engineer.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone-400">
          Curriculum, flashcards, canonical papers, and a markdown notebook —
          tuned for the transition from applied MLE to frontier-lab
          post-training work. Everything is static, local-first, and built to
          be used every day.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm border border-amber-500/60 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 focus-visible:bg-amber-500/20"
          >
            Enter the desk
            <span aria-hidden className="mono text-[10px] tracking-widest">
              →
            </span>
          </Link>
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-bone-500">
            next: dashboard · curriculum · flashcards · papers · notes
          </span>
        </div>
      </section>

      <section className="mt-24 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-ink-700 bg-ink-700 sm:grid-cols-3">
        <Panel
          label="Track A"
          title="Post-training / RLHF"
          body="Policy-gradient foundations, PPO, reward modeling, DPO family, Constitutional AI, reasoning RL with GRPO, end-to-end recipes."
        />
        <Panel
          label="Track B"
          title="MLE fundamentals"
          body="Distributed training (FSDP, ZeRO, Megatron), GPU performance (Triton, FlashAttention), eval infra (lm-eval-harness, MT-Bench)."
        />
        <Panel
          label="Mode"
          title="Local-first, static"
          body="No accounts, no server, no LLM calls. Progress, scheduler state, and notes persist in localStorage with versioned schema."
        />
      </section>

      <footer className="mt-auto flex items-baseline justify-between border-t border-ink-700 pt-6 text-[11px] text-bone-500">
        <span className="mono uppercase tracking-[0.22em]">
          offline · static · keyboard-first
        </span>
        <span className="mono uppercase tracking-[0.22em]">0.1.0</span>
      </footer>
    </main>
  );
}

function Panel({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="bg-ink-950 p-6">
      <p className="mono mb-4 text-[10px] uppercase tracking-[0.28em] text-bone-500">
        {label}
      </p>
      <h2 className="font-serif text-2xl leading-tight text-bone-100">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-bone-400">{body}</p>
    </article>
  );
}
