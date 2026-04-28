"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The five primary tabs per FINAL_GOAL.md §3. `dashboard` is the landing tab;
 * curriculum / flashcards / papers / notes render stubs until the real UIs
 * ship in subsequent iterations — but their routes exist so the sidebar is
 * never a dead end.
 */
const TABS = [
  { href: "/dashboard", label: "Dashboard", short: "Desk" },
  { href: "/curriculum", label: "Curriculum", short: "Curr" },
  { href: "/flashcards", label: "Flashcards", short: "Cards" },
  { href: "/papers", label: "Papers", short: "Papers" },
  { href: "/notes", label: "Notes", short: "Notes" },
] as const;

export function SidebarNav({ variant = "side" }: { variant?: "side" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "bottom") {
    return (
      <>
        {TABS.slice(0, 4).map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 text-center py-2 text-[11px] uppercase tracking-[0.18em] ${
                active
                  ? "text-coral-500"
                  : "text-solar-600 hover:text-solar-700"
              }`}
            >
              {t.short}
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
                {active ? (
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-coral-500">
                    now
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
