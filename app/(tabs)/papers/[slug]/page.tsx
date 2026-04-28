// app/(tabs)/papers/[slug]/page.tsx
//
// Per-paper page. Server component that resolves the async `params` (Next
// 15 convention), looks up the paper, and hands off to the client
// component that owns the interactive reveal-gated question list.

import { notFound } from "next/navigation";

import { PAPERS, PAPERS_BY_SLUG } from "@/data/papers";

import { PaperReader } from "./paper-reader";

/** Pre-render every paper slug at build time. */
export function generateStaticParams() {
  return PAPERS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = PAPERS_BY_SLUG.get(slug);
  if (!paper) notFound();
  return <PaperReader paper={paper} />;
}
