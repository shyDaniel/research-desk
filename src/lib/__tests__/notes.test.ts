import { describe, it, expect } from "vitest";

import {
  DEFAULT_BODY,
  initialNotesState,
  normalizeNotesState,
  setBody,
  type NotesState,
} from "@/lib/notes";

describe("notes model — single scratchpad (FINAL_GOAL §3 Page 4)", () => {
  it("NotesState exposes exactly a string body — never a pages array", () => {
    const s = initialNotesState();
    const keys = Object.keys(s);
    expect(keys).toEqual(["body"]);
    expect(typeof s.body).toBe("string");
    expect(s.body.length).toBeGreaterThan(0);
    // The forbidden legacy shape must not leak through.
    expect(s).not.toHaveProperty("pages");
    // TypeScript-level: @ts-expect-error demonstrates the pages key is gone,
    // but that's a compile check; at runtime we just assert it's absent.
  });

  it("DEFAULT_BODY is a non-empty markdown string", () => {
    expect(typeof DEFAULT_BODY).toBe("string");
    expect(DEFAULT_BODY.length).toBeGreaterThan(0);
    expect(DEFAULT_BODY).toContain("#"); // has at least one ATX heading
  });

  it("initialNotesState returns a fresh, mutable copy each call", () => {
    const a = initialNotesState();
    const b = initialNotesState();
    expect(a).not.toBe(b);
    a.body = "mutated";
    expect(b.body).not.toBe("mutated");
  });

  it("normalizeNotesState falls back to defaults for garbage input", () => {
    expect(normalizeNotesState(null).body).toBe(DEFAULT_BODY);
    expect(normalizeNotesState(undefined).body).toBe(DEFAULT_BODY);
    expect(normalizeNotesState(42).body).toBe(DEFAULT_BODY);
    expect(normalizeNotesState([]).body).toBe(DEFAULT_BODY);
    expect(normalizeNotesState({}).body).toBe(DEFAULT_BODY);
  });

  it("normalizeNotesState accepts the canonical { body } shape", () => {
    const out = normalizeNotesState({ body: "hello **world**" });
    expect(out).toEqual({ body: "hello **world**" });
    expect(out).not.toHaveProperty("pages");
  });

  it("normalizeNotesState accepts a raw string payload", () => {
    const out = normalizeNotesState("just a string");
    expect(out.body).toBe("just a string");
  });

  it("normalizeNotesState rejects any 'pages' array when used as the canonical shape", () => {
    // A plain pages-only payload is legacy; it must migrate into a single
    // body string rather than being preserved as `pages`.
    const legacy = {
      pages: [
        { id: "notes", title: "Notes", body: "first" },
        { id: "scratch", title: "Scratch", body: "second" },
      ],
    };
    const out = normalizeNotesState(legacy);
    // The output state MUST NOT carry a pages field — single body only.
    expect(Object.keys(out)).toEqual(["body"]);
    expect(out).not.toHaveProperty("pages");
    // Legacy bodies are concatenated so nothing is lost on upgrade.
    expect(out.body).toContain("first");
    expect(out.body).toContain("second");
  });

  it("normalizeNotesState prefers body when both body and pages are supplied", () => {
    const out = normalizeNotesState({
      body: "canonical",
      pages: [{ id: "x", title: "X", body: "ignored" }],
    });
    expect(out).toEqual({ body: "canonical" });
  });

  it("normalizeNotesState returns defaults when pages exist but hold no real bodies", () => {
    const out = normalizeNotesState({ pages: [{ id: "x", title: "X", body: "" }] });
    expect(out.body).toBe(DEFAULT_BODY);
  });

  it("setBody updates the body and returns a new state object", () => {
    const s0: NotesState = initialNotesState();
    const s1 = setBody(s0, "hello **world**");
    expect(s1).not.toBe(s0);
    expect(s1.body).toBe("hello **world**");
  });

  it("setBody returns the same object if the body is unchanged", () => {
    const s0: NotesState = initialNotesState();
    const s1 = setBody(s0, s0.body);
    expect(s1).toBe(s0);
  });
});
