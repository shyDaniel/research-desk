import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarNav } from "./_components/sidebar-nav";

/**
 * Shared chrome for every in-app tab: persistent left sidebar (240–260px per
 * FINAL_GOAL.md §5), header strip with product name + track, and the scrolling
 * content region. The five nav entries — Dashboard, Curriculum, Flashcards,
 * Papers, Notes — are the product's top-level sections per FINAL_GOAL.md §3.
 *
 * Dashboard is the only tab with shipped content as of this iteration; the
 * others render "authoring in progress" stubs that still live inside this
 * layout so clicking them never dumps the user back to the marketing landing.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-solar-50 text-solar-700">
      <aside className="hidden w-[248px] shrink-0 border-r border-solar-200 bg-solar-100/60 md:flex md:flex-col">
        <div className="flex items-baseline gap-3 px-6 pt-8 pb-10">
          <Link href="/" className="flex items-baseline gap-3">
            <span
              aria-hidden
              className="h-2 w-2 translate-y-[-2px] rounded-full bg-coral-500"
            />
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
              research-desk
            </span>
          </Link>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-solar-200 px-6 py-5 text-[11px] leading-relaxed text-solar-600">
          <p className="mono uppercase tracking-[0.22em]">static · local-first</p>
          <p className="mt-1 mono uppercase tracking-[0.22em]">v0.1.0</p>
        </div>
      </aside>

      {/* Mobile top bar — sidebar collapses out on small screens. */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-solar-200 bg-solar-50/90 px-6 py-4 md:hidden">
          <Link href="/" className="flex items-baseline gap-3">
            <span
              aria-hidden
              className="h-2 w-2 translate-y-[-2px] rounded-full bg-coral-500"
            />
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
              research-desk
            </span>
          </Link>
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
            post-training
          </span>
        </header>

        {/* Mobile bottom nav — four primary tabs. Matches FINAL_GOAL.md §5
            responsive note: "Sidebar collapses to a bottom-nav on mobile". */}
        <main className="flex-1 px-6 py-10 pb-24 md:px-12 md:py-12 md:pb-12">
          {children}
        </main>

        <nav
          aria-label="Mobile primary"
          className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-solar-200 bg-solar-50/95 py-2 backdrop-blur md:hidden"
        >
          <SidebarNav variant="bottom" />
        </nav>
      </div>
    </div>
  );
}
