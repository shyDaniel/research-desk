// src/data/types.ts
//
// Shared types for authored content (curriculum, papers).
// This module is pure types + constants — no runtime logic, no side effects.

/** Phase in the RLHF-first learning arc. FINAL_GOAL.md §4 defines exactly 5. */
export type Phase = 1 | 2 | 3 | 4 | 5;

/** Editorial classification of a curriculum artifact. */
export type CurriculumType =
  | "Paper"
  | "Book chapter"
  | "Blog post"
  | "Video"
  | "Code project"
  | "Tutorial";

/** Study track. RLHF is primary; MLE-Fundamentals is the supporting track. */
export type Track = "RLHF" | "MLE-Fundamentals";

/**
 * A single curriculum item. Stable `id` is the contract — other data
 * (progress records, prerequisite refs) point at `id`, so renaming one
 * breaks persistence. Use short kebab-case tokens.
 */
export interface CurriculumItem {
  /** Stable kebab-case id, globally unique across the module. */
  id: string;
  /** Display title as written by the author / publisher. */
  title: string;
  /** What kind of artifact this is. Drives the icon in the UI. */
  type: CurriculumType;
  /** Phase this item anchors to. */
  phase: Phase;
  /** Study track. */
  track: Track;
  /** Canonical URL. Must start with https:// and host ∈ HOST_ALLOWLIST. */
  url: string;
  /**
   * Human-readable time estimate. Either hours ("~3h", "6–8h") or a
   * page count ("Ch 3, ~40 pages"). Short form, not prose.
   */
  timeEstimate: string;
  /**
   * 1–3 sentences in the voice of a Research Engineer mentor. Tells the
   * reader what to actually pay attention to — not a generic abstract.
   * Must be ≥ 40 characters; the test enforces it.
   */
  focusNote: string;
  /** IDs of curriculum items that should be read first. Can be empty. */
  prerequisites: string[];
}

/**
 * Host allow-list for curriculum URLs. Expanded only when a new source is
 * both real and authoritative (an actual lab, publisher, canonical tutorial
 * repo, or the author's well-known blog). The curriculum test imports this
 * list and asserts every `item.url` host is present.
 */
export const HOST_ALLOWLIST: ReadonlyArray<string> = [
  "arxiv.org",
  "openai.com",
  "anthropic.com",
  "www.anthropic.com",
  "deepmind.google",
  "huggingface.co",
  "github.com",
  "youtube.com",
  "www.youtube.com",
  "gpumode.com",
  "distill.pub",
  "www.deeplearningbook.org",
  "incompleteideas.net",
  "spinningup.openai.com",
  "rlhfbook.com",
  "allenai.org",
  "ai2.allenai.org",
  "jmlr.org",
  "proceedings.neurips.cc",
  "openreview.net",
  "pytorch.org",
  "nvidia.com",
  "developer.nvidia.com",
  "triton-lang.org",
  "icml.cc",
  "eleuther.ai",
  "lmsys.org",
  "iclr.cc",
  "neurips.cc",
  "aclanthology.org",
  "arxiv-vanity.com",
  "microsoft.com",
  "research.google",
  "meta.com",
  "ai.meta.com",
  "wandb.ai",
  "nathanlambert.com",
  "interconnects.ai",
  "www.interconnects.ai",
  "incompleteideas.net",
  "iclr-blog-track.github.io",
] as const;

export type AllowedHost = (typeof HOST_ALLOWLIST)[number];
