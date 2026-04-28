import { describe, it, expect } from "vitest";

import {
  DEFAULT_PAGES,
  initialNotesState,
  normalizeNotesState,
  setPageBody,
} from "@/lib/notes";

describe("notes model", () => {
  it("exposes at least three named default pages", () => {
    expect(DEFAULT_PAGES.length).toBeGreaterThanOrEqual(3);
    const ids = DEFAULT_PAGES.map((p) => p.id);
    expect(ids).toContain("notes");
    expect(ids).toContain("scratch");
    expect(ids).toContain("weekly-log");
    for (const p of DEFAULT_PAGES) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.body.length).toBeGreaterThan(0);
    }
  });

  it("initialNotesState returns a fresh, mutable copy", () => {
    const a = initialNotesState();
    const b = initialNotesState();
    expect(a).not.toBe(b);
    expect(a.pages).not.toBe(b.pages);
    a.pages[0]!.body = "mutated";
    expect(b.pages[0]!.body).not.toBe("mutated");
  });

  it("normalizeNotesState falls back to defaults for garbage input", () => {
    expect(normalizeNotesState(null).pages.length).toBe(DEFAULT_PAGES.length);
    expect(normalizeNotesState(undefined).pages.length).toBe(DEFAULT_PAGES.length);
    expect(normalizeNotesState(42).pages.length).toBe(DEFAULT_PAGES.length);
    expect(normalizeNotesState({ pages: "nope" }).pages.length).toBe(
      DEFAULT_PAGES.length
    );
  });

  it("normalizeNotesState preserves user-authored pages and backfills missing defaults", () => {
    const input = {
      pages: [
        { id: "notes", title: "Notes", body: "custom body" },
        // "scratch" and "weekly-log" deliberately missing
      ],
    };
    const out = normalizeNotesState(input);
    expect(out.pages.find((p) => p.id === "notes")?.body).toBe("custom body");
    expect(out.pages.some((p) => p.id === "scratch")).toBe(true);
    expect(out.pages.some((p) => p.id === "weekly-log")).toBe(true);
  });

  it("normalizeNotesState drops malformed entries and duplicates", () => {
    const input = {
      pages: [
        { id: "notes", title: "Notes", body: "ok" },
        { id: "notes", title: "Duplicate", body: "no" }, // duplicate id dropped
        { id: "", title: "Empty", body: "x" },              // empty id dropped
        { id: "custom", title: "Custom", body: "y" },
        { id: 5, title: "num", body: "z" },                   // bad shape dropped
      ] as unknown[],
    };
    const out = normalizeNotesState(input);
    const ids = out.pages.map((p) => p.id);
    expect(ids.filter((i) => i === "notes").length).toBe(1);
    expect(ids).toContain("custom");
    expect(ids).toContain("scratch");
    expect(ids).toContain("weekly-log");
    expect(ids).not.toContain("");
  });

  it("setPageBody updates only the targeted page and returns a new state object", () => {
    const s0 = initialNotesState();
    const s1 = setPageBody(s0, "notes", "hello **world**");
    expect(s1).not.toBe(s0);
    expect(s1.pages.find((p) => p.id === "notes")?.body).toBe("hello **world**");
    // Unrelated page is untouched
    const scratchBefore = s0.pages.find((p) => p.id === "scratch")?.body;
    const scratchAfter = s1.pages.find((p) => p.id === "scratch")?.body;
    expect(scratchBefore).toBe(scratchAfter);
  });

  it("setPageBody returns the same object if the id is unknown", () => {
    const s0 = initialNotesState();
    const s1 = setPageBody(s0, "nonexistent", "x");
    expect(s1).toBe(s0);
  });
});
