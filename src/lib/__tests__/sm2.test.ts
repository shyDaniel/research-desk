// src/lib/__tests__/sm2.test.ts
//
// Pure SM-2 scheduler invariants. All tests pin `now` so timestamp math is
// deterministic.

import { describe, expect, it } from "vitest";

import {
  DEFAULT_EASE,
  MIN_EASE,
  MS_PER_DAY,
  dueCount,
  grade,
  initialState,
  isDue,
  nextIntervalDays,
  partitionDeck,
  type SM2State,
} from "../sm2";

const T0 = 1_700_000_000_000;

describe("sm2 — initialState", () => {
  it("starts with default ease, zero interval/reps/lapses, due immediately", () => {
    const s = initialState(T0);
    expect(s.ease).toBe(DEFAULT_EASE);
    expect(s.interval).toBe(0);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(0);
    expect(s.due).toBe(T0);
    expect(s.lastReviewed).toBeNull();
  });
});

describe("sm2 — grade: 'good' first-three-reps schedule", () => {
  it("reps 0 → 1: interval 1d, ease unchanged, reps=1", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "good", T0);
    expect(s1.reps).toBe(1);
    expect(s1.interval).toBe(1);
    expect(s1.ease).toBeCloseTo(DEFAULT_EASE, 10);
    expect(s1.due).toBe(T0 + 1 * MS_PER_DAY);
    expect(s1.lastReviewed).toBe(T0);
  });

  it("reps 1 → 2: interval 6d", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "good", T0);
    const s2 = grade(s1, "good", T0 + MS_PER_DAY);
    expect(s2.reps).toBe(2);
    expect(s2.interval).toBe(6);
    expect(s2.ease).toBeCloseTo(DEFAULT_EASE, 10);
    expect(s2.due).toBe(T0 + MS_PER_DAY + 6 * MS_PER_DAY);
  });

  it("reps ≥ 2: interval multiplies by current ease", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "good", T0);
    const s2 = grade(s1, "good", T0 + MS_PER_DAY);
    const s3 = grade(s2, "good", T0 + 2 * MS_PER_DAY);
    expect(s3.reps).toBe(3);
    // 6 * 2.5 = 15
    expect(s3.interval).toBe(15);
    expect(s3.ease).toBeCloseTo(DEFAULT_EASE, 10);
  });
});

describe("sm2 — grade: 'easy' raises ease and accelerates", () => {
  it("first 'easy' gives 4d interval and bumps ease by ~0.10", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "easy", T0);
    expect(s1.interval).toBe(4);
    expect(s1.reps).toBe(1);
    // ΔEF for q=5: 0.1 - 0*(0.08 + 0) = +0.10
    expect(s1.ease).toBeCloseTo(DEFAULT_EASE + 0.1, 10);
  });

  it("second 'easy' gives 7d interval", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "easy", T0);
    const s2 = grade(s1, "easy", T0 + 4 * MS_PER_DAY);
    expect(s2.interval).toBe(7);
    expect(s2.reps).toBe(2);
    expect(s2.ease).toBeCloseTo(DEFAULT_EASE + 0.2, 6);
  });
});

describe("sm2 — grade: 'hard' drops ease and grows interval slowly", () => {
  it("'hard' on fresh card yields interval 1d, ease drops by ~0.14", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "hard", T0);
    expect(s1.interval).toBe(1);
    expect(s1.reps).toBe(1);
    // ΔEF for q=3: 0.1 - 2*(0.08 + 2*0.02) = 0.1 - 2*0.12 = -0.14
    expect(s1.ease).toBeCloseTo(DEFAULT_EASE - 0.14, 6);
  });

  it("'hard' after reps ≥ 1 multiplies prior interval by 1.2", () => {
    // Set up: good to reps=1 (interval=1), then hard.
    const s0 = initialState(T0);
    const s1 = grade(s0, "good", T0);
    const s2 = grade(s1, "hard", T0 + MS_PER_DAY);
    expect(s2.reps).toBe(2);
    // 1 * 1.2 = 1.2
    expect(s2.interval).toBeCloseTo(1.2, 5);
  });
});

describe("sm2 — grade: 'again' resets reps, increments lapses, short relearn", () => {
  it("'again' resets reps to 0, drops ease ~0.32, sets 10-minute relearn due", () => {
    const s0 = initialState(T0);
    const s1 = grade(s0, "good", T0); // reps=1, interval=1d
    const s2 = grade(s1, "again", T0 + MS_PER_DAY);
    expect(s2.reps).toBe(0);
    expect(s2.interval).toBe(0);
    expect(s2.lapses).toBe(1);
    // ΔEF for q=2: 0.1 - 3*(0.08 + 3*0.02) = 0.1 - 3*0.14 = -0.32
    expect(s2.ease).toBeCloseTo(DEFAULT_EASE - 0.32, 5);
    expect(s2.due).toBe(T0 + MS_PER_DAY + 10 * 60 * 1000);
  });

  it("repeated 'again' clamps ease at MIN_EASE (1.3)", () => {
    let s: SM2State = initialState(T0);
    for (let i = 0; i < 20; i++) {
      s = grade(s, "again", T0 + i * 60000);
    }
    expect(s.ease).toBe(MIN_EASE);
    expect(s.lapses).toBe(20);
  });
});

describe("sm2 — isDue / dueCount / partitionDeck", () => {
  const deck = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d" },
  ];

  it("cards with no state are treated as due immediately", () => {
    expect(dueCount(deck, {}, T0)).toBe(4);
    const { due, upcoming } = partitionDeck(deck, {}, T0);
    expect(due.map((c) => c.id).sort()).toEqual(["a", "b", "c", "d"]);
    expect(upcoming).toEqual([]);
  });

  it("due before now is due; due after now is upcoming", () => {
    const states = {
      a: { ...initialState(T0), due: T0 - 1000 }, // due 1s ago
      b: { ...initialState(T0), due: T0 + 1000 }, // due in 1s
      c: { ...initialState(T0), due: T0 }, // exactly now
      // d: missing → treated as due
    };
    const { due, upcoming } = partitionDeck(deck, states, T0);
    expect(due.map((c) => c.id)).toContain("a");
    expect(due.map((c) => c.id)).toContain("c");
    expect(due.map((c) => c.id)).toContain("d");
    expect(upcoming.map((c) => c.id)).toEqual(["b"]);
    expect(dueCount(deck, states, T0)).toBe(3);
  });

  it("isDue respects the timestamp", () => {
    const s = { ...initialState(T0), due: T0 + 5000 };
    expect(isDue(s, T0 + 4000)).toBe(false);
    expect(isDue(s, T0 + 5000)).toBe(true);
    expect(isDue(s, T0 + 6000)).toBe(true);
  });
});

describe("sm2 — nextIntervalDays (pure)", () => {
  it("good reps 0 → 1 day, reps 1 → 6 days, reps ≥ 2 → interval*ease", () => {
    const s0 = initialState(T0);
    expect(nextIntervalDays(s0, "good", DEFAULT_EASE)).toBe(1);
    const s1: SM2State = { ...s0, reps: 1, interval: 1 };
    expect(nextIntervalDays(s1, "good", DEFAULT_EASE)).toBe(6);
    const s2: SM2State = { ...s0, reps: 2, interval: 6 };
    expect(nextIntervalDays(s2, "good", DEFAULT_EASE)).toBe(15);
  });
});
