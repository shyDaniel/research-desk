"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCards } from "@/state/use-cards";

/**
 * The four primary tabs per FINAL_GOAL.md §5. Dashboard is gone — the
 * curriculum page is the home page. Each entry surfaces its own real UI.
 *
 * The Flashcards entry additionally exposes a due-count badge pulled from
 * `useCards().todayDue` so the user can see at a glance how many cards the
 * scheduler has queued for today.
 */
const TABS = [
  { href: "/curriculum", label: "Curriculum", short: "Curr" },
  { href: "/flashcards", label: "Flashcards", short: "Cards" },
  { href: "/papers", label: "Papers", short: "Papers" },
  { href: "/notes", label: "Notes", short: "Notes" },
] as const;

export function SidebarNav({ variant = "side" }: { variant?: "side" | "bottom" }) {
  const pathname = usePathname();
  const { todayDue, hydrated } = useCards();
  const showBadge = hydrated && todayDue > 0;

  if (variant === "bottom") {
    return (
      <>
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          const isCards = t.href === "/flashcards";
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex-1 text-center py-2 text-[11px] uppercase tracking-[0.18em] ${
                active
                  ? "text-coral-500"
                  : "text-solar-600 hover:text-solar-700"
              }`}
            >
              {t.short}
              {isCards && showBadge ? (
                <span
                  data-testid="bottom-cards-badge"
                  className="absolute top-1 right-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-1 font-serif text-[10px] leading-none text-solar-50"
                >
                  {todayDue}
                </span>
              ) : null}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav aria-label="Primary" className="flex flex-col px-3">
      <p className="mono mb-3 px-3 text-[10px] uppercase tracking-[0.28em] text-solar-500">
        Sections
      </p>
      <ul className="flex flex-col gap-0.5">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          const isCards = t.href === "/flashcards";
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-solar-200/70 text-coral-600"
                    : "text-solar-700 hover:bg-solar-100 hover:text-solar-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-coral-500" : "bg-solar-300 group-hover:bg-solar-400"
                    }`}
                  />
                  {t.label}
                </span>
                <span className="flex items-center gap-2">
                  {isCards && showBadge ? (
                    <span
                      data-testid="cards-due-badge"
                      aria-label={`${todayDue} flashcards due today`}
                      className="mono inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral-500 px-1.5 text-[10px] font-medium leading-none text-solar-50"
                    >
                      {todayDue}
                    </span>
                  ) : null}
                  {active ? (
                    <span className="mono text-[10px] uppercase tracking-[0.2em] text-coral-500">
                      now
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
