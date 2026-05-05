"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TRACK_META, TRACK_SLUGS, type TrackSlug } from "@/lib/track";

interface TrackSwitcherProps {
  active: TrackSlug;
}

export function TrackSwitcher({ active }: TrackSwitcherProps) {
  const pathname = usePathname() ?? `/${active}`;
  const tail = pathname.replace(/^\/(rlhf|mle)/, "");
  return (
    <div
      role="tablist"
      aria-label="Study track"
      data-testid="track-switcher"
      className="inline-flex rounded-sm border border-solar-300 bg-solar-100/60 p-[3px]"
    >
      {TRACK_SLUGS.map((slug) => {
        const isActive = slug === active;
        return (
          <Link
            key={slug}
            href={`/${slug}${tail || "/curriculum"}`}
            role="tab"
            aria-selected={isActive}
            data-testid={`track-tab-${slug}`}
            className={
              "mono px-3 py-1 text-[11px] uppercase tracking-[0.22em] transition-colors " +
              (isActive
                ? "rounded-sm bg-solar-50 text-coral-600 shadow-sm"
                : "text-solar-600 hover:text-solar-800")
            }
          >
            {TRACK_META[slug].label}
          </Link>
        );
      })}
    </div>
  );
}
