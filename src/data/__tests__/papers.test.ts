// src/data/__tests__/papers.test.ts
//
// Structural invariants for the authored papers data module. No network,
// no DOM — pure data validation under Vitest.

import { describe, expect, it } from "vitest";

import { PAPERS, PAPERS_BY_SLUG } from "../papers";
import { HOST_ALLOWLIST } from "../types";

const URL_RE = /^https?:\/\//;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_RE = /\b(lorem|ipsum|todo|fixme|xxx|tbd|placeholder)\b/i;

describe("papers data", () => {
  it("has at least 10 papers", () => {
    expect(PAPERS.length).toBeGreaterThanOrEqual(10);
  });

  it("slugs are unique and kebab-case", () => {
    const slugs = PAPERS.map((p) => p.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes).toEqual([]);
    for (const s of slugs) {
      expect(s, `slug ${s} is not kebab-case`).toMatch(SLUG_RE);
    }
    expect(PAPERS_BY_SLUG.size).toBe(PAPERS.length);
  });

  it("every url is http(s) and host is on HOST_ALLOWLIST", () => {
    const allow = new Set<string>(HOST_ALLOWLIST);
    for (const p of PAPERS) {
      expect(p.url, `${p.slug} url`).toMatch(URL_RE);
      const host = new URL(p.url).host;
      expect(allow.has(host), `${p.slug} host ${host} not on allow-list`).toBe(
        true,
      );
    }
  });

  it("covers the ten canonical papers required by FINAL_GOAL.md §4", () => {
    const required = [
      "instructgpt",
      "ppo",
      "christiano-2017",
      "dpo",
      "constitutional-ai",
      "deepseek-r1",
      "lets-verify",
      "zero",
      "flashattention",
      "rlaif",
    ];
    for (const slug of required) {
      expect(
        PAPERS_BY_SLUG.has(slug),
        `canonical paper ${slug} missing from PAPERS`,
      ).toBe(true);
    }
  });

  it("every paper has a non-empty title, authors, venue, and year", () => {
    for (const p of PAPERS) {
      expect(p.title.trim().length, `${p.slug} title`).toBeGreaterThan(0);
      expect(p.authors.trim().length, `${p.slug} authors`).toBeGreaterThan(0);
      expect(p.venue.trim().length, `${p.slug} venue`).toBeGreaterThan(0);
      expect(p.year, `${p.slug} year`).toBeGreaterThanOrEqual(2015);
      expect(p.year, `${p.slug} year`).toBeLessThanOrEqual(2030);
    }
  });

  it("every summary is ≥ 200 chars and placeholder-free", () => {
    for (const p of PAPERS) {
      expect(
        p.summary.trim().length,
        `${p.slug} summary too short`,
      ).toBeGreaterThanOrEqual(200);
      expect(
        PLACEHOLDER_RE.test(p.summary),
        `${p.slug} summary has placeholder token`,
      ).toBe(false);
    }
  });

  it("every paper has between 5 and 7 questions inclusive", () => {
    for (const p of PAPERS) {
      expect(
        p.questions.length,
        `${p.slug} has ${p.questions.length} questions`,
      ).toBeGreaterThanOrEqual(5);
      expect(p.questions.length).toBeLessThanOrEqual(7);
    }
  });

  it("every question id is unique within its paper and kebab-case", () => {
    for (const p of PAPERS) {
      const ids = p.questions.map((q) => q.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dupes, `${p.slug} has duplicate question ids`).toEqual([]);
      for (const id of ids) {
        expect(id, `${p.slug}/${id} is not kebab-case`).toMatch(SLUG_RE);
      }
    }
  });

  it("every question prompt is ≥ 20 chars and placeholder-free", () => {
    for (const p of PAPERS) {
      for (const q of p.questions) {
        expect(
          q.prompt.trim().length,
          `${p.slug}/${q.id} prompt too short`,
        ).toBeGreaterThanOrEqual(20);
        expect(
          PLACEHOLDER_RE.test(q.prompt),
          `${p.slug}/${q.id} prompt has placeholder token`,
        ).toBe(false);
      }
    }
  });

  // FINAL_GOAL §4: never "what does X stand for". §7: every question prompt
  // is "walk through" / "explain why" / "explain how" form. The two failure
  // modes this test pins are:
  //   1. The whole prompt opens with "What does …" — the canonical
  //      definition-lookup shape §4 forbids.
  //   2. The prompt anywhere contains the "stand for" idiom, which is the
  //      load-bearing detail §4 calls out by name.
  // Mid-prompt "what does X imply / tell you / buy you" follow-up clauses
  // are explicitly NOT banned: those are colloquial framings of consequence
  // questions ("what does this imply"), not acronym definitions.
  it("no question prompt opens with 'What does …' or contains the 'stand for' idiom", () => {
    const OPENS_WITH_WHAT_DOES_RE = /^\s*what\s+does\b/i;
    const STAND_FOR_RE = /\bstand(s)?\s+for\b/i;
    const offenders: string[] = [];
    for (const p of PAPERS) {
      for (const q of p.questions) {
        const trimmed = q.prompt.trim();
        if (OPENS_WITH_WHAT_DOES_RE.test(trimmed)) {
          offenders.push(
            `${p.slug}/${q.id} opens with "What does …": "${trimmed.slice(0, 80)}"`,
          );
          continue;
        }
        if (STAND_FOR_RE.test(trimmed)) {
          offenders.push(
            `${p.slug}/${q.id} uses "stand for" idiom: "${trimmed.slice(0, 80)}"`,
          );
        }
      }
    }
    expect(
      offenders,
      `prompts violate FINAL_GOAL §4 (no "what does X stand for"):\n${offenders.join(
        "\n",
      )}`,
    ).toEqual([]);
  });

  it("track is RLHF or MLE-Fundamentals and at least one paper on each", () => {
    const tracks = new Set(PAPERS.map((p) => p.track));
    expect(tracks.has("RLHF")).toBe(true);
    expect(tracks.has("MLE-Fundamentals")).toBe(true);
    for (const p of PAPERS) {
      expect(["RLHF", "MLE-Fundamentals"]).toContain(p.track);
    }
  });
});
