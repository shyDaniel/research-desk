"use client";

// app/(tabs)/flashcards/page.tsx
//
// Real flashcards surface per FINAL_GOAL.md §3.3 + the S-086 brief. The page
// wires:
//   - the authored deck (src/data/flashcards.ts)
//   - the pure SM-2 scheduler (src/lib/sm2.ts)
//   - the persistent React state hook (src/state/use-cards.ts)
// into a UI with:
//   - a flip animation (CSS 3D transform) that reveals the answer
//   - Space to flip, 1/2/3/4 to grade (Again/Hard/Good/Easy)
//   - a due queue shown first, with explicit empty-state when drained
//   - a per-card details drawer showing ease / interval / reps / lapses
//   - sidebar-visible due count (rendered inside this page's header strip)
//
// The page is a single client component: persistence is localStorage-only,
// so there's no SSR work to hydrate and we avoid the complexity of a server
// shell + client island split.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { FLASHCARDS, type Flashcard } from "@/data/flashcards";
import {
  DEFAULT_EASE,
  grade as gradePure,
  initialState,
  type Grade,
  type SM2State,
} from "@/lib/sm2";
import { useCards } from "@/state/use-cards";

const GRADES: Array<{ key: Grade; label: string; shortcut: string; tint: string }> = [
  {
    key: "again",
    label: "Again",
    shortcut: "1",
    tint: "border-[#DC322F] text-[#DC322F] bg-[#DC322F]/10 hover:bg-[#DC322F]/20",
  },
  {
    key: "hard",
    label: "Hard",
    shortcut: "2",
    tint: "border-[#B58900] text-[#B58900] bg-[#B58900]/10 hover:bg-[#B58900]/20",
  },
  {
    key: "good",
    label: "Good",
    shortcut: "3",
    tint: "border-coral-500 text-coral-600 bg-coral-500/10 hover:bg-coral-500/20",
  },
  {
    key: "easy",
    label: "Easy",
    shortcut: "4",
    tint: "border-[#859900] text-[#859900] bg-[#859900]/10 hover:bg-[#859900]/20",
  },
];

export default function FlashcardsPage() {
  const cards = useCards();
  const [flipped, setFlipped] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // When the deck drains we want to keep showing the last card on screen
  // until the user explicitly advances — avoids a flashed empty state.
  const [cursor, setCursor] = useState<string | null>(null);

  // Queue = due list. Upcoming is only shown in the "drained" state.
  const current: Flashcard | undefined = useMemo(() => {
    if (!cards.hydrated) return undefined;
    // Prefer the explicit cursor if it still points at a due card.
    if (cursor) {
      const match = cards.due.find((c) => c.id === cursor);
      if (match) return match;
    }
    return cards.due[0];
  }, [cards.hydrated, cards.due, cursor]);

  // Whenever the current card changes, reset the flipped flag — we always
  // show the FRONT of a new card first.
  useEffect(() => {
    setFlipped(false);
    setDetailsOpen(false);
    if (current && cursor !== current.id) setCursor(current.id);
    // `cursor` intentionally excluded — changing it here would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const onFlip = useCallback(() => setFlipped((f) => !f), []);

  const onGrade = useCallback(
    (g: Grade) => {
      if (!current) return;
      cards.grade(current.id, g);
      // Clear cursor so next render picks the new head of the due queue.
      setCursor(null);
      setFlipped(false);
    },
    [cards, current]
  );

  // Keyboard handling: Space flips; 1/2/3/4 grade (only when the card has
  // been flipped — grading a card you haven't seen the back of would be
  // meaningless). Bind at window level so focus can live anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      // Ignore when the user is typing in the (future) notes textarea.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        onFlip();
        return;
      }
      if (!flipped) return;
      switch (e.key) {
        case "1":
          e.preventDefault();
          onGrade("again");
          break;
        case "2":
          e.preventDefault();
          onGrade("hard");
          break;
        case "3":
          e.preventDefault();
          onGrade("good");
          break;
        case "4":
          e.preventDefault();
          onGrade("easy");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, flipped, onFlip, onGrade]);

  const state: SM2State = current
    ? cards.getState(current.id)
    : initialState(0);

  return (
    <div className="mx-auto max-w-5xl" data-testid="flashcards-root">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-solar-200 pb-6">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
            Flashcards · SM-2
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-solar-800">
            {FLASHCARDS.length} cards, one scheduler, zero spoon-feeding.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-solar-600">
            Spaced-repetition deck over RLHF and MLE fundamentals. Every answer
            is paragraph-length and technically precise — you are supposed to
            type them out before revealing. <kbd className="mono rounded border border-solar-300 px-1.5 py-0.5 text-[11px] text-solar-700">Space</kbd> flips,
            {" "}
            <kbd className="mono rounded border border-solar-300 px-1.5 py-0.5 text-[11px] text-solar-700">1</kbd>
            /<kbd className="mono rounded border border-solar-300 px-1.5 py-0.5 text-[11px] text-solar-700">2</kbd>
            /<kbd className="mono rounded border border-solar-300 px-1.5 py-0.5 text-[11px] text-solar-700">3</kbd>
            /<kbd className="mono rounded border border-solar-300 px-1.5 py-0.5 text-[11px] text-solar-700">4</kbd>
            {" "}grade.
          </p>
        </div>
        <DeckSummary
          todayDue={cards.todayDue}
          total={FLASHCARDS.length}
          hydrated={cards.hydrated}
        />
      </header>

      {!cards.hydrated ? (
        <HydratingSkeleton />
      ) : current ? (
        <section aria-labelledby="card-heading" className="grid gap-6">
          <CardStage
            card={current}
            flipped={flipped}
            onFlip={onFlip}
            state={state}
            queuePosition={cards.due.findIndex((c) => c.id === current.id) + 1}
            queueLength={cards.due.length}
          />

          <GradingRow
            flipped={flipped}
            onFlip={onFlip}
            onGrade={onGrade}
          />

          <DetailsStrip
            state={state}
            open={detailsOpen}
            onToggle={() => setDetailsOpen((o) => !o)}
            card={current}
          />
        </section>
      ) : (
        <EmptyState upcoming={cards.upcoming} onReset={cards.reset} />
      )}

      <aside className="mt-16 border-t border-solar-200 pt-6 text-[12px] text-solar-600">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
          Scheduler
        </p>
        <p className="mt-2 max-w-3xl leading-relaxed">
          SM-2 with Anki-style grade mapping (again=q2 / hard=q3 / good=q4 /
          easy=q5). Ease factor drifts as EF&apos; = EF + (0.1 −
          (5−q)(0.08 + 0.02(5−q))), clamped at 1.3. Intervals: again → 10
          min relearn, hard → prev × 1.2, good → {"{1, 6, prev × EF}"}, easy →
          {" {4, 7, prev × EF × 1.3}"}. All state persists to{" "}
          <code>research-desk:v1:cards</code> and survives reload.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="mono text-[11px] uppercase tracking-[0.22em] text-coral-600 hover:text-coral-700"
          >
            ← Back to dashboard
          </Link>
        </div>
      </aside>
    </div>
  );
}

function DeckSummary({
  todayDue,
  total,
  hydrated,
}: {
  todayDue: number;
  total: number;
  hydrated: boolean;
}) {
  return (
    <div
      data-testid="deck-summary"
      className="grid grid-cols-2 gap-4 rounded-sm border border-solar-200 bg-solar-100/60 px-5 py-4"
    >
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Due today
        </p>
        <p
          data-testid="due-count"
          className="mt-1 font-serif text-3xl leading-none text-coral-600"
        >
          {hydrated ? todayDue : "—"}
        </p>
      </div>
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Deck size
        </p>
        <p className="mt-1 font-serif text-3xl leading-none text-solar-700">
          {total}
        </p>
      </div>
    </div>
  );
}

function CardStage({
  card,
  flipped,
  onFlip,
  state,
  queuePosition,
  queueLength,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  state: SM2State;
  queuePosition: number;
  queueLength: number;
}) {
  // We implement the flip as a container with perspective and an inner
  // `transform-style: preserve-3d` that rotates by 180deg. The front and
  // back faces are absolutely positioned inside, with `backface-visibility`
  // hidden so only the facing side paints.
  //
  // Duration: 600ms. That's long enough to read (FINAL_GOAL §5 forbids
  // gratuitous animation but explicitly permits the card flip) and long
  // enough that a user doesn't miss the transition if they blink.
  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Card{" "}
          <span className="text-coral-600">{queuePosition}</span>
          <span className="text-solar-500"> / {queueLength}</span> in today&apos;s queue
        </p>
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          Topic: <span className="text-solar-700">{card.topic}</span>
        </p>
      </div>
      <button
        type="button"
        data-testid="card-stage"
        data-flipped={flipped}
        data-card-id={card.id}
        aria-label={flipped ? "Hide answer" : "Reveal answer"}
        onClick={onFlip}
        className="group relative block w-full text-left"
        style={{ perspective: "1600px" }}
      >
        <div
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 600ms cubic-bezier(0.4, 0.05, 0.2, 1)",
            transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)",
            minHeight: "24rem",
          }}
        >
          {/* FRONT */}
          <article
            data-testid="card-front"
            aria-hidden={flipped}
            className="absolute inset-0 flex flex-col rounded-sm border border-solar-200 bg-solar-100 p-10 shadow-card"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-500">
              Prompt · ease {state.ease.toFixed(2)} · interval {state.interval}d · reps {state.reps}
            </p>
            <h2
              id="card-heading"
              className="mt-6 font-serif text-[28px] leading-snug text-solar-800"
            >
              {card.front}
            </h2>
            <div className="mt-auto pt-10">
              <span className="mono text-[11px] uppercase tracking-[0.22em] text-coral-600">
                Space / click → reveal answer
              </span>
            </div>
          </article>

          {/* BACK */}
          <article
            data-testid="card-back"
            aria-hidden={!flipped}
            className="absolute inset-0 flex flex-col rounded-sm border border-coral-400 bg-solar-50 p-10 shadow-card"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-600">
              Answer
            </p>
            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-solar-800">
              {card.back}
            </p>
            <div className="mt-auto pt-8">
              <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
                Grade with 1 / 2 / 3 / 4 or the buttons below
              </span>
            </div>
          </article>
        </div>
      </button>
    </div>
  );
}

function GradingRow({
  flipped,
  onFlip,
  onGrade,
}: {
  flipped: boolean;
  onFlip: () => void;
  onGrade: (g: Grade) => void;
}) {
  if (!flipped) {
    return (
      <div className="flex">
        <button
          type="button"
          data-testid="flip-cta"
          onClick={onFlip}
          className="rounded-sm border border-coral-500 bg-coral-500 px-6 py-3 font-serif text-[17px] text-solar-50 transition-colors hover:bg-coral-600"
        >
          Reveal answer <span className="mono ml-2 text-[11px] uppercase tracking-[0.22em]">Space</span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="grading-row"
      role="group"
      aria-label="Grade this card"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {GRADES.map((g) => (
        <button
          key={g.key}
          type="button"
          data-testid={`grade-${g.key}`}
          onClick={() => onGrade(g.key)}
          aria-label={`Grade ${g.label} (keyboard shortcut ${g.shortcut})`}
          className={`flex flex-col items-start gap-1 rounded-sm border px-4 py-3 text-left transition-colors ${g.tint}`}
        >
          <span className="mono text-[10px] uppercase tracking-[0.22em]">
            Key {g.shortcut}
          </span>
          <span className="font-serif text-xl">{g.label}</span>
        </button>
      ))}
    </div>
  );
}

function DetailsStrip({
  state,
  open,
  onToggle,
  card,
}: {
  state: SM2State;
  open: boolean;
  onToggle: () => void;
  card: Flashcard;
}) {
  return (
    <div
      data-testid="details-strip"
      className="rounded-sm border border-solar-200 bg-solar-100/60"
    >
      <button
        type="button"
        data-testid="details-toggle"
        aria-expanded={open}
        aria-controls="card-details-body"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="mono text-[10px] uppercase tracking-[0.28em] text-solar-600">
          Card details — ease / interval / reps
        </span>
        <span className="mono text-[11px] text-coral-600">
          {open ? "Hide −" : "Show +"}
        </span>
      </button>
      {open ? (
        <div
          id="card-details-body"
          data-testid="details-body"
          className="grid gap-6 border-t border-solar-200 px-5 py-5 md:grid-cols-2"
        >
          <dl className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Card id
              </dt>
              <dd className="mt-1 mono text-[#268BD2]">{card.id}</dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Ease factor
              </dt>
              <dd
                data-testid="detail-ease"
                className="mt-1 font-serif text-lg text-solar-800"
              >
                {state.ease.toFixed(2)}
                <span className="mono ml-2 text-[11px] text-solar-500">
                  (default {DEFAULT_EASE.toFixed(2)})
                </span>
              </dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Interval (days)
              </dt>
              <dd
                data-testid="detail-interval"
                className="mt-1 font-serif text-lg text-solar-800"
              >
                {state.interval}
              </dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Reps
              </dt>
              <dd
                data-testid="detail-reps"
                className="mt-1 font-serif text-lg text-solar-800"
              >
                {state.reps}
              </dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Lapses
              </dt>
              <dd
                data-testid="detail-lapses"
                className="mt-1 font-serif text-lg text-solar-800"
              >
                {state.lapses}
              </dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
                Next due
              </dt>
              <dd
                data-testid="detail-due"
                className="mt-1 font-serif text-base text-solar-800"
              >
                {formatDueRelative(state)}
              </dd>
            </div>
          </dl>
          <div className="text-[13px] leading-relaxed text-solar-700">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
              Next interval preview
            </p>
            <ul className="mt-2 space-y-1">
              {(["again", "hard", "good", "easy"] as const).map((g) => {
                const preview = gradePure(state, g, 0);
                return (
                  <li key={g} data-testid={`preview-${g}`}>
                    <span className="mono text-[#268BD2]">{g}</span>{" "}
                    → interval {preview.interval}d, ease{" "}
                    {preview.ease.toFixed(2)}, reps {preview.reps}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({
  upcoming,
  onReset,
}: {
  upcoming: Flashcard[];
  onReset: () => void;
}) {
  const hasNext = upcoming.length > 0;
  return (
    <section
      data-testid="empty-state"
      className="rounded-sm border border-solar-200 bg-solar-100/60 p-10 text-center"
    >
      <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
        Queue drained
      </p>
      <h2 className="mt-3 font-serif text-3xl text-solar-800">
        No cards due right now.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-solar-600">
        You&apos;ve graded every card due today. Spaced repetition works best
        when you come back tomorrow rather than grinding ahead — the algorithm
        is optimising for long-term retention, not for a clean inbox.
      </p>
      {hasNext ? (
        <p className="mt-6 mono text-[11px] uppercase tracking-[0.22em] text-solar-500">
          {upcoming.length} card{upcoming.length === 1 ? "" : "s"} waiting in
          the scheduler&apos;s backlog.
        </p>
      ) : null}
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-sm border border-coral-500 bg-coral-500 px-5 py-2 font-serif text-sm text-solar-50 hover:bg-coral-600"
        >
          Back to dashboard
        </Link>
        <button
          type="button"
          data-testid="reset-deck"
          onClick={onReset}
          className="rounded-sm border border-solar-300 px-5 py-2 font-serif text-sm text-solar-700 hover:border-coral-400"
        >
          Reset deck (start over)
        </button>
      </div>
    </section>
  );
}

function HydratingSkeleton() {
  return (
    <div
      aria-busy
      className="flex min-h-[24rem] items-center justify-center rounded-sm border border-solar-200 bg-solar-100/40"
    >
      <p className="mono text-[11px] uppercase tracking-[0.28em] text-solar-500">
        Loading deck state…
      </p>
    </div>
  );
}

function formatDueRelative(s: SM2State): string {
  if (s.lastReviewed === null) return "now (new card)";
  const delta = s.due - Date.now();
  if (delta <= 0) return "now";
  return "in " + formatFromNow(delta);
}

function formatFromNow(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
