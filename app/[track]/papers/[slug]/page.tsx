import { notFound } from "next/navigation";

import { PAPERS, PAPERS_BY_SLUG } from "@/data/papers";
import { parseTrackSlug, slugToTrack, TRACK_SLUGS, type TrackSlug } from "@/lib/track";

import { PaperReader } from "./paper-reader";

export function generateStaticParams(): Array<{ track: TrackSlug; slug: string }> {
  const params: Array<{ track: TrackSlug; slug: string }> = [];
  for (const trackSlug of TRACK_SLUGS) {
    const track = slugToTrack(trackSlug);
    for (const p of PAPERS) {
      if (p.track === track) params.push({ track: trackSlug, slug: p.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string; slug: string }>;
}) {
  const { slug } = await params;
  const paper = PAPERS_BY_SLUG.get(slug);
  if (!paper) return { title: "Paper not found · Research Desk" };
  return {
    title: `${paper.title} · Research Desk`,
    description: paper.summary.slice(0, 200),
  };
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ track: string; slug: string }>;
}) {
  const { track: rawTrack, slug } = await params;
  const trackSlug = parseTrackSlug(rawTrack);
  if (!trackSlug) notFound();
  const paper = PAPERS_BY_SLUG.get(slug);
  if (!paper || paper.track !== slugToTrack(trackSlug)) notFound();
  return <PaperReader paper={paper} trackSlug={trackSlug} />;
}
