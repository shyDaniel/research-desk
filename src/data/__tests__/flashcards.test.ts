// src/data/__tests__/flashcards.test.ts
//
// Structural invariants over the authored flashcard deck.
// Required by FINAL_GOAL.md §4 "Flashcard coverage":
//   - ≥ 30 cards
//   - answers paragraph-length (≥ 200 chars is our concrete floor)
//   - every listed topic is represented by at least one card

import { describe, expect, it } from "vitest";

import { FLASHCARDS, FLASHCARDS_BY_ID, type Flashcard } from "../flashcards";

// Each entry in TOPIC_PROBES maps a FINAL_GOAL §4 bullet to a substring (or
// id prefix) we require to appear in at least one card's front/id/back. The
// probes are deliberately permissive — we want to fail if the TOPIC is
// dropped, not if phrasing changes.
const TOPIC_PROBES: ReadonlyArray<{ label: string; match: (c: Flashcard) => boolean }> = [
  { label: "forward-vs-reverse KL", match: (c) => c.id === "kl-forward-reverse" },
  { label: "PPO clipped surrogate", match: (c) => c.id === "ppo-clipped-surrogate" },
  { label: "PPO vs DPO value function", match: (c) => c.id === "ppo-vs-dpo-value" },
  { label: "Bradley-Terry preference", match: (c) => c.id === "bradley-terry" },
  { label: "KL penalty to reference", match: (c) => c.id === "kl-penalty-purpose" },
  { label: "DPO derivation", match: (c) => c.id === "dpo-derivation" },
  { label: "GRPO advantage", match: (c) => c.id === "grpo-advantage" },
  { label: "Process RM vs Outcome RM", match: (c) => c.id === "prm-vs-orm" },
  { label: "ZeRO stages", match: (c) => c.id === "zero-stages" },
  { label: "FSDP vs DDP", match: (c) => c.id === "fsdp-vs-ddp" },
  { label: "activation checkpointing", match: (c) => c.id === "activation-checkpointing" },
  { label: "bf16 vs fp16", match: (c) => c.id === "bf16-vs-fp16" },
  { label: "KV cache formula", match: (c) => c.id === "kv-cache-memory" },
  { label: "continuous batching / vLLM", match: (c) => c.id === "continuous-batching" },
  { label: "FlashAttention", match: (c) => c.id === "flash-attention" },
  { label: "speculative decoding", match: (c) => c.id === "speculative-decoding" },
  { label: "reward hacking", match: (c) => c.id === "reward-hacking" },
  { label: "length bias in RMs", match: (c) => c.id === "length-bias" },
  { label: "Constitutional AI", match: (c) => c.id === "constitutional-ai" },
  { label: "GAE lambda", match: (c) => c.id === "gae" },
  { label: "importance sampling", match: (c) => c.id === "importance-sampling" },
  { label: "RLHF beats SFT", match: (c) => c.id === "rlhf-vs-sft" },
  { label: "frozen reference model", match: (c) => c.id === "frozen-reference" },
  { label: "RM calibration", match: (c) => c.id === "rm-calibration" },
  { label: "Tulu 3 recipe", match: (c) => c.id === "tulu3-recipe" },
];

describe("flashcards data", () => {
  it("has at least 30 cards", () => {
    expect(FLASHCARDS.length).toBeGreaterThanOrEqual(30);
  });

  it("has unique ids", () => {
    const ids = FLASHCARDS.map((c) => c.id);
    const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    expect(dupes).toEqual([]);
    expect(FLASHCARDS_BY_ID.size).toBe(FLASHCARDS.length);
  });

  it("every card has a non-empty front and topic", () => {
    for (const c of FLASHCARDS) {
      expect(c.front, c.id).toBeTruthy();
      expect(c.front.length, c.id).toBeGreaterThanOrEqual(10);
      expect(c.topic, c.id).toBeTruthy();
    }
  });

  it("every answer is paragraph-length (≥ 200 chars)", () => {
    for (const c of FLASHCARDS) {
      expect(c.back.length, `card ${c.id} answer too short`).toBeGreaterThanOrEqual(200);
    }
  });

  it("no placeholder tokens in answers", () => {
    const forbidden = [/\bTODO\b/i, /\bFIXME\b/i, /\bLOREM\b/i, /\bplaceholder\b/i];
    for (const c of FLASHCARDS) {
      for (const re of forbidden) {
        expect(re.test(c.back), `card ${c.id} contains ${re}`).toBe(false);
      }
    }
  });

  it("prerequisite ids all resolve", () => {
    const ids = new Set(FLASHCARDS.map((c) => c.id));
    for (const c of FLASHCARDS) {
      for (const p of c.prereqs ?? []) {
        expect(ids.has(p), `card ${c.id} prereq ${p} missing`).toBe(true);
      }
    }
  });

  it.each(TOPIC_PROBES)(
    "FINAL_GOAL §4 topic covered: $label",
    ({ match }) => {
      const found = FLASHCARDS.some(match);
      expect(found).toBe(true);
    }
  );
});
