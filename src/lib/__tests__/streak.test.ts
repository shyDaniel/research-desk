// src/lib/__tests__/streak.test.ts
//
// Unit tests for the weekly-streak reducer. FINAL_GOAL.md §3.1 defines
// "day qualifies when ≥ 1 curriculum item is marked done OR ≥ 5 flashcards
// are reviewed". These tests pin that contract, including the ≥5 threshold,
// the same-day counter reset, and the last-7-day projection.

import { describe, expect, it } from "vitest";

import {
  addActivity,
  currentRun,
  DAILY_CARD_THRESHOLD,
  EMPTY_STREAK,
  isoDate,
  last7,
  recordCardReview,
  recordProgressDone,
  recordProgressTouch,
  streakCount,
  type StreakState,
} from "../streak";

// A fixed reference timestamp so the tests are deterministic across
// machines / timezones that round midnight weirdly. 2026-04-27 local noon.
const T = (iso: string) => new Date(`${iso}T12:00:00`).getTime();

describe("isoDate", () => {
  it("produces a YYYY-MM-DD string in local time", () => {
    expect(isoDate(T("2026-04-27"))).toBe("2026-04-27");
    expect(isoDate(T("2026-01-01"))).toBe("2026-01-01");
  });
});

describe("addActivity", () => {
  it("adds a new day", () => {
    const next = addActivity(EMPTY_STREAK, "2026-04-27");
    expect(next.days).toEqual(["2026-04-27"]);
  });

  it("is idempotent for the same day", () => {
    const once = addActivity(EMPTY_STREAK, "2026-04-27");
    const twice = addActivity(once, "2026-04-27");
    expect(twice.days).toEqual(["2026-04-27"]);
  });

  it("keeps days sorted ascending", () => {
    let s = EMPTY_STREAK;
    s = addActivity(s, "2026-04-27");
    s = addActivity(s, "2026-04-25");
    s = addActivity(s, "2026-04-26");
    expect(s.days).toEqual(["2026-04-25", "2026-04-26", "2026-04-27"]);
  });
});

describe("recordProgressDone", () => {
  it("adds today and sets lastTouched", () => {
    const s = recordProgressDone(EMPTY_STREAK, T("2026-04-27"), "p1-x");
    expect(s.days).toEqual(["2026-04-27"]);
    expect(s.lastTouched).toEqual({ id: "p1-x", at: T("2026-04-27") });
  });

  it("does not duplicate today", () => {
    let s = EMPTY_STREAK;
    s = recordProgressDone(s, T("2026-04-27"), "a");
    s = recordProgressDone(s, T("2026-04-27"), "b");
    expect(s.days).toEqual(["2026-04-27"]);
    // Newer lastTouched wins.
    expect(s.lastTouched?.id).toBe("b");
  });
});

describe("recordProgressTouch", () => {
  it("updates lastTouched without adding a day", () => {
    const s = recordProgressTouch(EMPTY_STREAK, T("2026-04-27"), "p1-x");
    expect(s.days).toEqual([]);
    expect(s.lastTouched?.id).toBe("p1-x");
  });

  it("newest touch wins", () => {
    let s = EMPTY_STREAK;
    s = recordProgressTouch(s, T("2026-04-27"), "a");
    s = recordProgressTouch(s, T("2026-04-27") + 5000, "b");
    expect(s.lastTouched?.id).toBe("b");
  });
});

describe("recordCardReview", () => {
  it("increments cardsToday without marking the day before the threshold", () => {
    let s = EMPTY_STREAK;
    for (let i = 0; i < DAILY_CARD_THRESHOLD - 1; i++) {
      s = recordCardReview(s, T("2026-04-27"));
    }
    expect(s.cardsToday).toEqual({
      date: "2026-04-27",
      count: DAILY_CARD_THRESHOLD - 1,
    });
    expect(s.days).toEqual([]);
  });

  it("marks the day exactly at the ≥5 threshold and is idempotent after", () => {
    let s = EMPTY_STREAK;
    for (let i = 0; i < DAILY_CARD_THRESHOLD; i++) {
      s = recordCardReview(s, T("2026-04-27"));
    }
    expect(s.days).toEqual(["2026-04-27"]);
    // One more review — day stays, count advances.
    s = recordCardReview(s, T("2026-04-27"));
    expect(s.days).toEqual(["2026-04-27"]);
    expect(s.cardsToday.count).toBe(DAILY_CARD_THRESHOLD + 1);
  });

  it("resets the counter when the date rolls over", () => {
    let s = EMPTY_STREAK;
    s = recordCardReview(s, T("2026-04-27"));
    s = recordCardReview(s, T("2026-04-28"));
    expect(s.cardsToday).toEqual({ date: "2026-04-28", count: 1 });
  });

  it("threshold constant matches FINAL_GOAL §3.1 (≥5)", () => {
    expect(DAILY_CARD_THRESHOLD).toBe(5);
  });
});

describe("last7", () => {
  it("returns 7 slots, oldest first, today last", () => {
    const today = T("2026-04-27");
    const slots = last7(EMPTY_STREAK, today);
    expect(slots).toHaveLength(7);
    expect(slots[0]!.date).toBe("2026-04-21");
    expect(slots[6]!.date).toBe("2026-04-27");
    expect(slots.every((s) => s.active === false)).toBe(true);
  });

  it("lights up only the dates in the active set", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-04-25", "2026-04-27"],
    };
    const slots = last7(s, T("2026-04-27"));
    const activePattern = slots.map((d) => d.active);
    //                                 21   22   23   24   25    26   27
    expect(activePattern).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it("ignores dates older than 7 days", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-01-01", "2026-04-27"],
    };
    const slots = last7(s, T("2026-04-27"));
    expect(slots.filter((d) => d.active).map((d) => d.date)).toEqual([
      "2026-04-27",
    ]);
  });
});

describe("streakCount", () => {
  it("counts qualifying days in the last 7", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-04-24", "2026-04-25", "2026-04-27"],
    };
    expect(streakCount(s, T("2026-04-27"))).toBe(3);
  });

  it("is 0 on a blank slate", () => {
    expect(streakCount(EMPTY_STREAK, T("2026-04-27"))).toBe(0);
  });
});

describe("currentRun", () => {
  it("counts consecutive active days ending today", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-04-24", "2026-04-25", "2026-04-26", "2026-04-27"],
    };
    expect(currentRun(s, T("2026-04-27"))).toBe(4);
  });

  it("breaks on the first inactive day", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-04-21", "2026-04-22", "2026-04-27"],
    };
    // Today (04-27) active → run = 1 because 04-26 broken.
    expect(currentRun(s, T("2026-04-27"))).toBe(1);
  });

  it("is 0 when today is not active", () => {
    const s: StreakState = {
      ...EMPTY_STREAK,
      days: ["2026-04-25", "2026-04-26"],
    };
    expect(currentRun(s, T("2026-04-27"))).toBe(0);
  });
});
