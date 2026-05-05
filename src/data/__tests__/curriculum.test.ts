// src/data/__tests__/curriculum.test.ts
//
// Structural invariants for the authored curriculum. Runs under Vitest.
// No network, no DOM — pure data validation.

import { describe, expect, it } from "vitest";

import { CURRICULUM, CURRICULUM_BY_ID } from "../curriculum";
import { HOST_ALLOWLIST } from "../types";

const URL_RE = /^https?:\/\//;

// Phase-count envelope straight from FINAL_GOAL.md §4 / subtask brief S-030.
const PHASE_RANGE: Record<1 | 2 | 3 | 4 | 5, [number, number]> = {
  1: [8, 12],
  2: [10, 14],
  3: [8, 11],
  4: [8, 11],
  5: [8, 12],
};

describe("curriculum data", () => {
  it("has at least 55 items", () => {
    expect(CURRICULUM.length).toBeGreaterThanOrEqual(55);
  });

  it("has unique ids", () => {
    const ids = CURRICULUM.map((i) => i.id);
    const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    expect(dupes).toEqual([]);
    expect(CURRICULUM_BY_ID.size).toBe(CURRICULUM.length);
  });

  it("every url is http(s) and host is allow-listed", () => {
    const allow = new Set<string>(HOST_ALLOWLIST);
    for (const item of CURRICULUM) {
      expect(item.url, `${item.id} url`).toMatch(URL_RE);
      const host = new URL(item.url).host;
      expect(allow.has(host), `${item.id} host ${host} not on allow-list`).toBe(
        true,
      );
    }
  });

  it("every focusNote is a real mentor-voice paragraph (≥ 200 chars)", () => {
    // FINAL_GOAL.md §4: focusNote is required, ≥ 200 characters, 4–8 sentences
    // in mentor voice. The 40-char floor predated the polish bar — raise it.
    for (const item of CURRICULUM) {
      expect(
        item.focusNote.trim().length,
        `${item.id} focusNote too short`,
      ).toBeGreaterThanOrEqual(200);
      // Reject obvious placeholder text.
      expect(item.focusNote.toLowerCase()).not.toMatch(/lorem|todo|fixme|xxx/);
    }
  });

  it("every focusNote ends with a concrete Self-check sentence", () => {
    // FINAL_GOAL.md §4: "end with a one-sentence self-check ('Self-check: …')".
    // The retrieval question after the marker must be at least 25 characters
    // — generic 'understand X' lines are a §4.2 polish failure.
    for (const item of CURRICULUM) {
      const note = item.focusNote.trim();
      const match = note.match(/Self-check:\s*(\S.*)$/);
      expect(
        match,
        `${item.id} focusNote missing 'Self-check: …' tail`,
      ).not.toBeNull();
      const question = (match?.[1] ?? "").trim();
      expect(
        question.length,
        `${item.id} Self-check question too short (${question.length} chars)`,
      ).toBeGreaterThanOrEqual(25);
    }
  });

  it("every title is non-empty", () => {
    for (const item of CURRICULUM) {
      expect(item.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("every timeEstimate is non-empty", () => {
    for (const item of CURRICULUM) {
      expect(item.timeEstimate.trim().length).toBeGreaterThan(0);
    }
  });

  it("every prerequisite id resolves to another item", () => {
    for (const item of CURRICULUM) {
      for (const prereq of item.prerequisites) {
        expect(
          CURRICULUM_BY_ID.has(prereq),
          `${item.id} references missing prerequisite ${prereq}`,
        ).toBe(true);
        expect(prereq, `${item.id} cannot prereq itself`).not.toBe(item.id);
      }
    }
  });

  it("phase counts match FINAL_GOAL.md §4 ranges", () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const item of CURRICULUM) counts[item.phase] = (counts[item.phase] ?? 0) + 1;
    for (const phase of [1, 2, 3, 4, 5] as const) {
      const [lo, hi] = PHASE_RANGE[phase];
      expect(
        counts[phase],
        `phase ${phase} has ${counts[phase]} items, expected in [${lo}, ${hi}]`,
      ).toBeGreaterThanOrEqual(lo);
      expect(counts[phase]).toBeLessThanOrEqual(hi);
    }
  });

  it("phase is one of 1..5 and track is RLHF or MLE-Fundamentals", () => {
    for (const item of CURRICULUM) {
      expect([1, 2, 3, 4, 5]).toContain(item.phase);
      expect(["RLHF", "MLE-Fundamentals"]).toContain(item.track);
    }
  });

  it("type is one of the six allowed editorial kinds", () => {
    const allowed = [
      "Paper",
      "Book chapter",
      "Blog post",
      "Video",
      "Code project",
      "Tutorial",
    ];
    for (const item of CURRICULUM) {
      expect(allowed).toContain(item.type);
    }
  });

  it("prerequisite graph has no cycles", () => {
    // DFS with colors: white=unvisited, gray=in stack, black=done.
    const color = new Map<string, "white" | "gray" | "black">();
    for (const item of CURRICULUM) color.set(item.id, "white");

    const visit = (id: string, path: string[]): void => {
      if (color.get(id) === "gray") {
        throw new Error(
          `prerequisite cycle: ${[...path, id].join(" → ")}`,
        );
      }
      if (color.get(id) === "black") return;
      color.set(id, "gray");
      const item = CURRICULUM_BY_ID.get(id);
      if (item) {
        for (const p of item.prerequisites) visit(p, [...path, id]);
      }
      color.set(id, "black");
    };

    expect(() => {
      for (const item of CURRICULUM) visit(item.id, []);
    }).not.toThrow();
  });

  it("RLHF track covers the five-phase arc", () => {
    // At least one RLHF item per phase — otherwise the track is broken.
    for (const phase of [1, 2, 3, 4, 5] as const) {
      const any = CURRICULUM.some(
        (i) => i.phase === phase && i.track === "RLHF",
      );
      expect(any, `phase ${phase} has no RLHF item`).toBe(true);
    }
  });
});
