import { TabStub } from "../_components/tab-stub";

export default function PapersPage() {
  return (
    <TabStub
      label="Papers"
      title="Ten papers, read on purpose."
      description="Canonical RLHF + reasoning-RL papers with editorial summaries — why each matters for the OpenAI / Anthropic post-training path — plus pointed comprehension questions that punish passive reading."
      bullets={[
        "InstructGPT · PPO · Christiano'17 · DPO · CAI · DeepSeek-R1 / GRPO · Let's Verify · ZeRO · FlashAttention · RLAIF.",
        "5–7 pointed questions per paper, with a per-question answer textarea that persists.",
        "Reveal-my-answer gate requires ≥ 40 characters typed — no passive reading.",
        "Self-graded; no LLM in the loop, by design.",
      ]}
    />
  );
}
