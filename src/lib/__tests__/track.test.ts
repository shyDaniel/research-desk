// src/lib/__tests__/track.test.ts
//
// Regression guards for TRACK_META taglines and slug parsing. The H1 on
// /[track]/curriculum renders the tagline with only its first character
// lowercased (so the sentence flows after "N items, ...") — acronyms inside
// must stay uppercase. S-017 fixed a bug where the page called toLowerCase()
// on the entire string, lowercasing 'RL' and 'GPU'. These assertions exist
// to prevent that regression at the data layer.

import { describe, expect, it } from "vitest";

import { parseTrackSlug, slugToTrack, TRACK_META, trackToSlug, TRACK_SLUGS } from "../track";

describe("TRACK_META", () => {
  it("rlhf tagline preserves 'RL' acronym", () => {
    expect(TRACK_META.rlhf.tagline).toContain("RL");
    expect(TRACK_META.rlhf.tagline).not.toMatch(/\brl\b/);
  });

  it("mle tagline preserves 'GPU' acronym", () => {
    expect(TRACK_META.mle.tagline).toContain("GPU");
    expect(TRACK_META.mle.tagline).not.toMatch(/\bgpu\b/);
  });

  it("every tagline starts with an uppercase letter and ends with a period", () => {
    for (const slug of TRACK_SLUGS) {
      const t = TRACK_META[slug].tagline;
      expect(t.charAt(0)).toBe(t.charAt(0).toUpperCase());
      expect(t.endsWith(".")).toBe(true);
    }
  });
});

describe("parseTrackSlug", () => {
  it("accepts known slugs", () => {
    expect(parseTrackSlug("rlhf")).toBe("rlhf");
    expect(parseTrackSlug("mle")).toBe("mle");
  });

  it("rejects unknown values", () => {
    expect(parseTrackSlug("RLHF")).toBeNull();
    expect(parseTrackSlug("")).toBeNull();
    expect(parseTrackSlug("research")).toBeNull();
  });
});

describe("slugToTrack / trackToSlug round-trip", () => {
  it("round-trips both slugs", () => {
    for (const slug of TRACK_SLUGS) {
      expect(trackToSlug(slugToTrack(slug))).toBe(slug);
    }
  });
});
