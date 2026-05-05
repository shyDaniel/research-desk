// Track is the global axis: the user picks one in the header switcher and
// every page scopes its content to that choice. URL slug is lowercase
// (`/rlhf/...`, `/mle/...`); internal Track values stay as authored.

import type { Track } from "@/data/types";

export type TrackSlug = "rlhf" | "mle";

export const TRACK_SLUGS: ReadonlyArray<TrackSlug> = ["rlhf", "mle"] as const;

export const TRACK_META: Record<TrackSlug, { track: Track; label: string; tagline: string }> = {
  rlhf: {
    track: "RLHF",
    label: "RLHF",
    tagline: "Post-training, preference optimization, reasoning RL.",
  },
  mle: {
    track: "MLE-Fundamentals",
    label: "MLE Fundamentals",
    tagline: "Distributed training and GPU systems you must know.",
  },
};

export function parseTrackSlug(value: string): TrackSlug | null {
  return (TRACK_SLUGS as ReadonlyArray<string>).includes(value) ? (value as TrackSlug) : null;
}

export function trackToSlug(track: Track): TrackSlug {
  return track === "RLHF" ? "rlhf" : "mle";
}

export function slugToTrack(slug: TrackSlug): Track {
  return TRACK_META[slug].track;
}
