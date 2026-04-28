// src/lib/__tests__/progress.test.ts
//
// Unit tests for the progress reducer. The pending → inprog → done → pending
// cycle is load-bearing UX for the curriculum tab, so it gets exhaustive
// coverage here (the "progress reducer" tests FINAL_GOAL §1 names).

import { describe, expect, it } from "vitest";

import {
  cycleProgress,
  getProgress,
  nextState,
  setProgress,
  summarize,
  type ProgressMap,
} from "../progress";

describe("nextState", () => {
  it("cycles pending → inprog → done → pending", () => {
    expect(nextState("pending")).toBe("inprog");
    expect(nextState("inprog")).toBe("done");
    expect(nextState("done")).toBe("pending");
  });
});

describe("cycleProgress", () => {
  it("starts at pending when the id has never been seen", () => {
    const after = cycleProgress({}, "x");
    expect(after).toEqual({ x: "inprog" });
  });

  it("advances inprog to done", () => {
    expect(cycleProgress({ x: "inprog" }, "x")).toEqual({ x: "done" });
  });

  it("wraps done back to pending and REMOVES the entry", () => {
    const after = cycleProgress({ x: "done" }, "x");
    expect(after).toEqual({});
    expect("x" in after).toBe(false);
  });

  it("does not mutate the input map", () => {
    const m: ProgressMap = { a: "inprog" };
    const before = JSON.stringify(m);
    cycleProgress(m, "a");
    expect(JSON.stringify(m)).toBe(before);
  });

  it("leaves other entries alone", () => {
    const after = cycleProgress({ a: "done", b: "inprog" }, "b");
    expect(after).toEqual({ a: "done", b: "done" });
  });

  it("two clicks from scratch => done", () => {
    const once = cycleProgress({}, "x");
    const twice = cycleProgress(once, "x");
    expect(twice).toEqual({ x: "done" });
  });

  it("three clicks from scratch => empty (pending)", () => {
    let m: ProgressMap = {};
    m = cycleProgress(m, "x");
    m = cycleProgress(m, "x");
    m = cycleProgress(m, "x");
    expect(m).toEqual({});
    expect(getProgress(m, "x")).toBe("pending");
  });
});

describe("setProgress", () => {
  it("writes explicit states", () => {
    expect(setProgress({}, "x", "done")).toEqual({ x: "done" });
    expect(setProgress({ x: "done" }, "x", "inprog")).toEqual({ x: "inprog" });
  });

  it("removes the entry on pending (keeps persisted blob small)", () => {
    expect(setProgress({ x: "done" }, "x", "pending")).toEqual({});
  });
});

describe("getProgress", () => {
  it("defaults to pending for unknown ids", () => {
    expect(getProgress({}, "x")).toBe("pending");
  });

  it("returns the stored state", () => {
    expect(getProgress({ x: "done" }, "x")).toBe("done");
  });
});

describe("summarize", () => {
  it("counts across a set of ids", () => {
    const map: ProgressMap = { a: "done", b: "inprog", c: "done" };
    expect(summarize(map, ["a", "b", "c", "d"])).toEqual({
      done: 2,
      inprog: 1,
      pending: 1,
      total: 4,
    });
  });

  it("empty id set => all zeros", () => {
    expect(summarize({}, [])).toEqual({ done: 0, inprog: 0, pending: 0, total: 0 });
  });
});
