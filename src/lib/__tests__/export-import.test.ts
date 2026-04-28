// src/lib/__tests__/export-import.test.ts
//
// Unit coverage for the Export / Import JSON serializer in src/lib/storage.
// These back the FINAL_GOAL §2 hard acceptance ("user can download full
// state and re-upload it") and the subtask brief ("round-trip and
// version-mismatch rejection").

import { describe, expect, it } from "vitest";

import {
  applyImportBundle,
  buildExportBundle,
  CURRENT_VERSION,
  EXPORT_SCHEMA,
  EXPORT_SLOT_NAMES,
  parseImportBundle,
  serializeExportBundle,
  summarizeBundle,
  type ExportBundle,
  type ExportSlotName,
} from "../storage";

function staticReaders(
  values: Partial<Record<ExportSlotName, unknown>>,
): Record<ExportSlotName, () => unknown> {
  const readers = {} as Record<ExportSlotName, () => unknown>;
  for (const slot of EXPORT_SLOT_NAMES) {
    const v = slot in values ? values[slot] : null;
    readers[slot] = () => v ?? null;
  }
  return readers;
}

function capturingWriters(): {
  writers: Record<ExportSlotName, (data: unknown) => void>;
  seen: Partial<Record<ExportSlotName, unknown>>;
} {
  const seen: Partial<Record<ExportSlotName, unknown>> = {};
  const writers = {} as Record<ExportSlotName, (data: unknown) => void>;
  for (const slot of EXPORT_SLOT_NAMES) {
    writers[slot] = (data) => {
      seen[slot] = data;
    };
  }
  return { writers, seen };
}

describe("buildExportBundle", () => {
  it("wraps slot payloads in the schema + version envelope", () => {
    const readers = staticReaders({
      progress: { foo: "done" },
      cards: { a: { ef: 2.5 } },
      notes: { pages: [{ id: "notes", title: "Notes", body: "body" }] },
    });
    const frozen = new Date("2026-04-27T00:00:00.000Z");
    const bundle = buildExportBundle(readers, frozen);
    expect(bundle.schema).toBe(EXPORT_SCHEMA);
    expect(bundle.version).toBe(CURRENT_VERSION);
    expect(bundle.exportedAt).toBe("2026-04-27T00:00:00.000Z");
    expect(bundle.data.progress).toEqual({ foo: "done" });
    expect(bundle.data.cards).toEqual({ a: { ef: 2.5 } });
    expect(bundle.data.paperAnswers).toBeNull();
    expect(bundle.data.notes).toEqual({
      pages: [{ id: "notes", title: "Notes", body: "body" }],
    });
    expect(bundle.data.streak).toBeNull();
    expect(bundle.data.itemNotes).toBeNull();
  });

  it("emits all six slots even when every reader returns null", () => {
    const bundle = buildExportBundle(staticReaders({}));
    for (const slot of EXPORT_SLOT_NAMES) {
      expect(bundle.data).toHaveProperty(slot);
      expect(bundle.data[slot]).toBeNull();
    }
  });
});

describe("serializeExportBundle", () => {
  it("produces indented JSON the user can edit by hand", () => {
    const bundle = buildExportBundle(staticReaders({ progress: { a: "done" } }));
    const s = serializeExportBundle(bundle);
    // Pretty-printed: multiple lines, two-space indent.
    expect(s).toContain("\n");
    expect(s).toContain('  "schema": "research-desk"');
    expect(s).toContain('  "version": 1');
  });

  it("round-trips through parseImportBundle identity-like", () => {
    const original: ExportBundle = buildExportBundle(
      staticReaders({
        progress: { x: "inprog" },
        cards: { c1: { interval: 6 } },
        notes: { pages: [{ id: "a", title: "A", body: "hi" }] },
      }),
      new Date("2026-04-27T10:11:12.000Z"),
    );
    const s = serializeExportBundle(original);
    const parsed = parseImportBundle(s);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.bundle.schema).toBe(EXPORT_SCHEMA);
    expect(parsed.bundle.version).toBe(CURRENT_VERSION);
    expect(parsed.bundle.exportedAt).toBe("2026-04-27T10:11:12.000Z");
    expect(parsed.bundle.data).toEqual(original.data);
  });
});

describe("parseImportBundle — version guard", () => {
  it("rejects non-JSON payloads with 'invalid-json'", () => {
    const r = parseImportBundle("not actually json {");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid-json");
  });

  it("rejects JSON arrays and primitives with 'not-a-bundle'", () => {
    for (const raw of ["[]", "42", '"hello"', "null"]) {
      const r = parseImportBundle(raw);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe("not-a-bundle");
    }
  });

  it("rejects a payload whose schema is not 'research-desk'", () => {
    const raw = JSON.stringify({
      schema: "somebody-elses-app",
      version: 1,
      data: emptyData(),
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("wrong-schema");
      expect(r.detail).toBe("somebody-elses-app");
    }
  });

  it("rejects payloads with a non-numeric version", () => {
    const raw = JSON.stringify({
      schema: EXPORT_SCHEMA,
      version: "one",
      data: emptyData(),
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unknown-version");
  });

  it("rejects a bundle with a future version instead of crashing", () => {
    const raw = JSON.stringify({
      schema: EXPORT_SCHEMA,
      version: CURRENT_VERSION + 1,
      data: emptyData(),
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("unknown-version");
      expect(r.detail).toBe(String(CURRENT_VERSION + 1));
    }
  });

  it("rejects a bundle missing the data object", () => {
    const raw = JSON.stringify({ schema: EXPORT_SCHEMA, version: 1 });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("bad-data-shape");
  });

  it("rejects a bundle missing a slot key inside data", () => {
    const partial = { ...emptyData() } as Record<string, unknown>;
    delete partial.notes;
    const raw = JSON.stringify({
      schema: EXPORT_SCHEMA,
      version: 1,
      data: partial,
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("bad-data-shape");
      expect(r.detail).toBe("notes");
    }
  });

  it("accepts a minimal valid bundle even with null values for every slot", () => {
    const raw = JSON.stringify({
      schema: EXPORT_SCHEMA,
      version: CURRENT_VERSION,
      data: emptyData(),
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(true);
  });

  it("tolerates a missing exportedAt field (treats as epoch)", () => {
    const raw = JSON.stringify({
      schema: EXPORT_SCHEMA,
      version: CURRENT_VERSION,
      data: emptyData(),
    });
    const r = parseImportBundle(raw);
    expect(r.ok).toBe(true);
    if (r.ok) expect(typeof r.bundle.exportedAt).toBe("string");
  });
});

describe("summarizeBundle", () => {
  it("splits slots into present / empty by null-ness", () => {
    const bundle = buildExportBundle(
      staticReaders({
        progress: { a: "done" },
        notes: { pages: [] },
      }),
    );
    const summary = summarizeBundle(bundle);
    expect(summary.present.sort()).toEqual(["notes", "progress"]);
    expect(summary.empty.sort()).toEqual(
      ["cards", "itemNotes", "paperAnswers", "streak"].sort(),
    );
  });
});

describe("applyImportBundle", () => {
  it("writes every non-null slot and skips nulls", () => {
    const bundle = buildExportBundle(
      staticReaders({
        progress: { a: "done" },
        cards: { c: { interval: 1 } },
        // paperAnswers / notes / streak / itemNotes left null
      }),
    );
    const { writers, seen } = capturingWriters();
    const result = applyImportBundle(bundle, writers);
    expect(result.written.sort()).toEqual(["cards", "progress"]);
    expect(result.skipped.sort()).toEqual(
      ["itemNotes", "notes", "paperAnswers", "streak"].sort(),
    );
    expect(seen.progress).toEqual({ a: "done" });
    expect(seen.cards).toEqual({ c: { interval: 1 } });
    expect(seen).not.toHaveProperty("notes");
  });

  it("end-to-end round trip: build → serialize → parse → apply", () => {
    const original = buildExportBundle(
      staticReaders({
        progress: { sutton: "done", ppo: "inprog" },
        cards: {
          "kl-forward-reverse": {
            ef: 2.4,
            interval: 6,
            reps: 2,
            lapses: 0,
            dueAt: 1_700_000_000_000,
          },
        },
        paperAnswers: {
          instructgpt: { "alignment-tax": "long paragraph" },
        },
        notes: {
          pages: [
            { id: "notes", title: "Notes", body: "text" },
            { id: "scratch", title: "Scratch", body: "scratch body" },
            { id: "weekly-log", title: "Weekly log", body: "w/c 2026-04-27" },
          ],
        },
        streak: { days: ["2026-04-27"], cardsToday: { date: "2026-04-27", count: 3 } },
        itemNotes: { sutton: "finished chapter 4" },
      }),
    );
    const serialized = serializeExportBundle(original);
    const parsed = parseImportBundle(serialized);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { writers, seen } = capturingWriters();
    const result = applyImportBundle(parsed.bundle, writers);
    expect(result.written.length).toBe(EXPORT_SLOT_NAMES.length);
    // Every slot's data must match the originally-exported value exactly.
    for (const slot of EXPORT_SLOT_NAMES) {
      expect(seen[slot]).toEqual(original.data[slot]);
    }
  });
});

function emptyData() {
  const o: Record<string, null> = {};
  for (const slot of EXPORT_SLOT_NAMES) o[slot] = null;
  return o;
}
