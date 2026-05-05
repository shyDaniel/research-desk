import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { parseTrackSlug, TRACK_META, TRACK_SLUGS, type TrackSlug } from "@/lib/track";

import { SidebarNav } from "./_components/sidebar-nav";
import { TrackSwitcher } from "./_components/track-switcher";

export function generateStaticParams(): Array<{ track: TrackSlug }> {
  return TRACK_SLUGS.map((track) => ({ track }));
}

interface TrackLayoutProps {
  children: ReactNode;
  params: Promise<{ track: string }>;
}

export default async function TrackLayout({ children, params }: TrackLayoutProps) {
  const { track: rawTrack } = await params;
  const slug = parseTrackSlug(rawTrack);
  if (!slug) notFound();
  const meta = TRACK_META[slug];

  return (
    <div className="flex min-h-screen bg-solar-50 text-solar-700">
      <aside className="hidden w-[248px] shrink-0 border-r border-solar-200 bg-solar-100/60 md:flex md:flex-col">
        <div className="flex items-baseline gap-3 px-6 pt-8 pb-6">
          <Link href={`/${slug}/curriculum`} className="flex items-baseline gap-3">
            <span aria-hidden className="h-2 w-2 translate-y-[-2px] rounded-full bg-coral-500" />
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
              research-desk
            </span>
          </Link>
        </div>

        <div className="px-6 pb-6">
          <TrackSwitcher active={slug} />
          <p className="mt-3 max-w-[200px] text-[11px] leading-relaxed text-solar-500">
            {meta.tagline}
          </p>
        </div>

        <SidebarNav track={slug} />

        <div className="mt-auto border-t border-solar-200 px-6 py-5 text-[11px] leading-relaxed text-solar-600">
          <p className="mono uppercase tracking-[0.22em]">static · local-first</p>
          <p className="mt-1 mono uppercase tracking-[0.22em]">v0.1.0</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-solar-200 bg-solar-50/90 px-6 py-4 md:hidden">
          <Link href={`/${slug}/curriculum`} className="flex items-baseline gap-3">
            <span aria-hidden className="h-2 w-2 translate-y-[-2px] rounded-full bg-coral-500" />
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-solar-600">
              research-desk
            </span>
          </Link>
          <TrackSwitcher active={slug} />
        </header>

        <main className="flex-1 px-6 py-10 pb-24 md:px-12 md:py-12 md:pb-12">{children}</main>

        <nav
          aria-label="Mobile primary"
          className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-solar-200 bg-solar-50/95 py-2 backdrop-blur md:hidden"
        >
          <SidebarNav track={slug} variant="bottom" />
        </nav>
      </div>
    </div>
  );
}
