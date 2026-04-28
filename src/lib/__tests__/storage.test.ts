// src/lib/__tests__/storage.test.ts
//
// Unit tests for the versioned localStorage envelope wrapper. These cover
// the "MINIMUM required tests" expectation in FINAL_GOAL.md §1 — graceful
// fallback on unreadable / future payloads, round-trip equality,
// migration hook composition.

import { describe, expect, it } from "vitest";

import {
  CURRENT_VERSION,
  parseEnvelope,
  type MigrationMap,
} from "../storage";

describe("parseEnvelope", () => {
  it("returns current-version data verbatim", () => {
    const raw = JSON.stringify({ version: CURRENT_VERSION, data: { a: 1 } });
    expect(parseEnvelope(raw, { a: 0 })).toEqual({ a: 1 });
  });

  it("returns fallback on unparseable JSON", () => {
    expect(parseEnvelope("{not json", { fallback: true })).toEqual({
      fallback: true,
    });
  });

  it("returns fallback when envelope shape is wrong (no version)", () => {
    const raw = JSON.stringify({ data: { a: 1 } });
    expect(parseEnvelope(raw, { a: 0 })).toEqual({ a: 0 });
  });

  it("returns fallback when envelope shape is wrong (no data)", () => {
    const raw = JSON.stringify({ version: CURRENT_VERSION });
    expect(parseEnvelope(raw, { a: 0 })).toEqual({ a: 0 });
  });

  it("returns fallback on a future version we don't know", () => {
    const raw = JSON.stringify({ version: CURRENT_VERSION + 99, data: { a: 1 } });
    expect(parseEnvelope(raw, { a: 0 })).toEqual({ a: 0 });
  });

  it("runs migrations forward from older versions", () => {
    // Pretend the current version is 1 and we're reading a v0 payload.
    // Migration from 0 → 1 doubles every value.
    const migrations: MigrationMap = {
      0: (input) => {
        const obj = input as Record<string, number>;
        const out: Record<string, number> = {};
        for (const k of Object.keys(obj)) out[k] = obj[k]! * 2;
        return out;
      },
    };
    const raw = JSON.stringify({ version: 0, data: { a: 3, b: 5 } });
    expect(parseEnvelope(raw, {}, migrations)).toEqual({ a: 6, b: 10 });
  });

  it("falls back gracefully when a migration is missing", () => {
    // v-1 payload with no migration registered.
    const raw = JSON.stringify({ version: -1, data: "x" });
    expect(parseEnvelope(raw, "fb")).toBe("fb");
  });

  it("falls back gracefully when a migration throws", () => {
    const migrations: MigrationMap = {
      0: () => {
        throw new Error("boom");
      },
    };
    const raw = JSON.stringify({ version: 0, data: {} });
    expect(parseEnvelope(raw, { safe: true }, migrations)).toEqual({
      safe: true,
    });
  });

  it("returns fallback for null payload", () => {
    const raw = JSON.stringify(null);
    expect(parseEnvelope(raw, "fb")).toBe("fb");
  });

  it("returns fallback when version is not a number", () => {
    const raw = JSON.stringify({ version: "1", data: "x" });
    expect(parseEnvelope(raw, "fb")).toBe("fb");
  });
});
