// src/data/curriculum.ts
//
// Authored curriculum for Research Desk. Order of entries inside each phase
// is the suggested reading order. IDs are stable and referenced by progress
// state in localStorage — do NOT rename without a migration.
//
// Invariants (enforced by src/data/__tests__/curriculum.test.ts):
//   - length ≥ 55
//   - every `url` starts with https:// and its host ∈ HOST_ALLOWLIST
//   - every `focusNote` is ≥ 200 characters, mentor-voice, and ends with
//     a one-sentence "Self-check: …" retrieval question (≥ 25 chars after
//     the marker). FINAL_GOAL.md §4.
//   - every `prerequisites[]` id resolves to another item in this file
//   - phase counts: P1 ∈ [8,12], P2 ∈ [10,14], P3 ∈ [8,11], P4 ∈ [8,11],
//                   P5 ∈ [8,12]
//   - every id is globally unique

import type { CurriculumItem } from "./types";

export const CURRICULUM: ReadonlyArray<CurriculumItem> = [
  // ──────────────────────────────────────────────────────────────────────
  // Phase 1 — Foundations (RL + MLE basics you need before any RLHF paper)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "p1-sutton-barto",
    title: "Reinforcement Learning: An Introduction (Sutton & Barto) — Ch 1–6",
    type: "Book chapter",
    phase: 1,
    track: "RLHF",
    url: "http://incompleteideas.net/book/RLbook2020.pdf",
    timeEstimate: "~12h / 140 pages",
    focusNote:
      "Chapters 1–6 are the vocabulary the rest of the field presumes. Skim the bandit chapter, then read value iteration, policy iteration, and TD(0) carefully — every RLHF paper uses the same MDP framing, and if the Bellman expectation equation isn't automatic you'll stall on PPO later. Self-check: write the Bellman expectation equation for v_π(s) in one line, then state the difference between policy iteration and value iteration without looking.",
    prerequisites: [],
  },
  {
    id: "p1-sutton-barto-pg",
    title: "Sutton & Barto — Ch 13 (Policy Gradient Methods)",
    type: "Book chapter",
    phase: 1,
    track: "RLHF",
    url: "http://incompleteideas.net/book/RLbook2020.pdf",
    timeEstimate: "~3h / 30 pages",
    focusNote:
      "This is the single most important chapter for RLHF. Derive REINFORCE yourself, then the policy-gradient theorem with a state-dependent baseline. If you can re-derive both without the book open you're ready for PPO; if not, go back. Self-check: state the policy-gradient theorem with a state-dependent baseline in one breath, and explain why subtracting V(s) reduces variance without biasing the gradient.",
    prerequisites: ["p1-sutton-barto"],
  },
  {
    id: "p1-spinning-up-rl-intro",
    title: "OpenAI Spinning Up — Intro to RL (Part 1 & 2)",
    type: "Tutorial",
    phase: 1,
    track: "RLHF",
    url: "https://spinningup.openai.com/en/latest/spinningup/rl_intro.html",
    timeEstimate: "~2h",
    focusNote:
      "Josh Achiam's notation is the de-facto standard in the RLHF literature (V^π, A^π, the trajectory form of the policy gradient). Learn his names for things — it will make reading the PPO and DPO papers noticeably faster. Self-check: define V^π(s), Q^π(s,a), and A^π(s,a) and write the trajectory form of the policy gradient using Spinning Up's notation, no peeking.",
    prerequisites: [],
  },
  {
    id: "p1-spinning-up-pg",
    title: "Spinning Up — Intro to Policy Optimization",
    type: "Tutorial",
    phase: 1,
    track: "RLHF",
    url: "https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html",
    timeEstimate: "~1.5h",
    focusNote:
      "Focus on the three equivalent forms of the policy gradient (reward-to-go, baseline, GAE) and exactly where each trades bias for variance. The GAE lambda knob shows up again in every PPO implementation in Phase 2. Self-check: name the three policy-gradient estimators, and for each say whether bias or variance is higher and why GAE(λ) interpolates between TD(0) and Monte Carlo.",
    prerequisites: ["p1-spinning-up-rl-intro", "p1-sutton-barto-pg"],
  },
  {
    id: "p1-kl-divergence-primer",
    title: "Spinning Up — Vanilla Policy Gradient & the KL-constrained objective",
    type: "Tutorial",
    phase: 1,
    track: "RLHF",
    url: "https://spinningup.openai.com/en/latest/algorithms/vpg.html",
    timeEstimate: "~45m",
    focusNote:
      "Know which KL direction RLHF uses (reverse KL, D_KL(π||π_ref)) and why — it explains the mode-seeking failure that reward hacking exploits. Draw the two KL pictures on paper; you will reference them in every DPO conversation. Self-check: state which KL direction RLHF penalizes, sketch the mode-seeking vs mode-covering picture, and explain in one sentence why this choice enables reward hacking.",
    prerequisites: [],
  },
  {
    id: "p1-importance-sampling",
    title: "Importance Sampling — Sutton & Barto §5.5–5.7",
    type: "Book chapter",
    phase: 1,
    track: "RLHF",
    url: "http://incompleteideas.net/book/RLbook2020.pdf",
    timeEstimate: "~1.5h",
    focusNote:
      "PPO is an off-policy method only because of importance sampling; the ratio π_new/π_old in the clip objective is the same estimator from this chapter. Understand the variance blow-up when π_new drifts — that's what clip exists to bound. Self-check: write the IS-corrected return estimator, then explain in one sentence why PPO's clip(ratio, 1-ε, 1+ε) is a band-aid for the same variance pathology.",
    prerequisites: ["p1-sutton-barto"],
  },
  {
    id: "p1-deep-learning-book-ch6",
    title: "Deep Learning Book — Ch 6 (Deep Feedforward Networks)",
    type: "Book chapter",
    phase: 1,
    track: "MLE-Fundamentals",
    url: "https://www.deeplearningbook.org/contents/mlp.html",
    timeEstimate: "~3h",
    focusNote:
      "Refresher on the math of backprop and stable cross-entropy. Skim if you're fresh, but don't skip §6.2.2.3 — the log-softmax numerical stability argument is exactly what trips people up when they first implement a reward model. Self-check: explain why naive softmax+log overflows in fp16 and write the log-sum-exp trick that fixes it, in three lines of pseudocode.",
    prerequisites: [],
  },
  {
    id: "p1-instructgpt",
    title: "Training language models to follow instructions with human feedback (InstructGPT)",
    type: "Paper",
    phase: 1,
    track: "RLHF",
    url: "https://arxiv.org/abs/2203.02155",
    timeEstimate: "~3h",
    focusNote:
      "The first end-to-end RLHF recipe on a production LM. Read for the pipeline shape (SFT → RM → PPO), the alignment-tax discussion, and the labeler-agreement numbers — those numbers set expectations for every later RLHF system you'll build. Self-check: state the three pipeline stages, the inter-labeler agreement number reported, and one concrete benchmark where alignment tax shows up.",
    prerequisites: ["p1-sutton-barto-pg", "p1-kl-divergence-primer"],
  },
  {
    id: "p1-lambert-rlhf-book-intro",
    title: "The RLHF Book — Introduction & Ch 1–3",
    type: "Book chapter",
    phase: 1,
    track: "RLHF",
    url: "https://rlhfbook.com/",
    timeEstimate: "~2h",
    focusNote:
      "Nathan Lambert's living textbook. The intro chapters stitch together what the canonical papers leave implicit (why preferences, why not just SFT, where the field came from). Read before Phase 2 and you'll have the vocabulary to skim PPO faster. Self-check: in two sentences, explain why preference optimization beats pure SFT for instruction following, citing one of Lambert's framings.",
    prerequisites: [],
  },
  {
    id: "p1-karpathy-nanogpt",
    title: "Karpathy — Let's build GPT: from scratch (video + nanoGPT)",
    type: "Video",
    phase: 1,
    track: "MLE-Fundamentals",
    url: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
    timeEstimate: "~2h",
    focusNote:
      "You will modify an autoregressive LM in every later phase. Either this lecture or the nanoGPT repo must be muscle memory before you touch reward modeling — in particular, where the logits live and how log-probs are computed per token. Self-check: pseudocode the per-token log-prob computation from a [B, T, V] logits tensor and a [B, T] targets tensor in three lines.",
    prerequisites: [],
  },
  {
    id: "p1-nanogpt-repo",
    title: "Karpathy — nanoGPT (code)",
    type: "Code project",
    phase: 1,
    track: "MLE-Fundamentals",
    url: "https://github.com/karpathy/nanoGPT",
    timeEstimate: "~2h reading + 1h tinkering",
    focusNote:
      "Clone it, run train_shakespeare.py, add a hook that prints per-token log-probs. Everything in Phase 2 assumes you can already get log-probs out of a model — do the wiring once here instead of debugging it under PPO. Self-check: name the file in nanoGPT where the loss is computed and which line you would patch to grab per-token log-probs without affecting training.",
    prerequisites: ["p1-karpathy-nanogpt"],
  },

  // ──────────────────────────────────────────────────────────────────────
  // Phase 2 — PPO & Reward Modeling
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "p2-ppo-paper",
    title: "Proximal Policy Optimization Algorithms (Schulman et al. 2017)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/1707.06347",
    timeEstimate: "~2h",
    focusNote:
      "The clipped surrogate objective L^CLIP is the load-bearing equation — memorize it in both forms (min of clipped and unclipped). Pay attention to §6.1: the KL-penalty variant is what RLHF actually uses, not the fixed-clip one. Self-check: write L^CLIP(θ) = E_t[min(r_t·A_t, clip(r_t,1-ε,1+ε)·A_t)] and explain in one sentence why RLHF prefers the KL-penalty form over fixed clipping.",
    prerequisites: ["p1-spinning-up-pg", "p1-importance-sampling"],
  },
  {
    id: "p2-gae",
    title: "High-Dimensional Continuous Control Using GAE (Schulman et al. 2015)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/1506.02438",
    timeEstimate: "~1.5h",
    focusNote:
      "Skim for the λ tradeoff only: λ=1 is unbiased high-variance Monte Carlo, λ=0 is biased low-variance one-step TD. Every RLHF PPO codebase ships λ≈0.95; you should be able to say why out loud in one sentence. Self-check: justify λ=0.95 in one sentence — what bias does it introduce, what variance does it kill, and why isn't 1.0 the obvious answer?",
    prerequisites: ["p1-spinning-up-pg"],
  },
  {
    id: "p2-costa-huang-37-details",
    title: "The 37 Implementation Details of Proximal Policy Optimization",
    type: "Blog post",
    phase: 2,
    track: "RLHF",
    url: "https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/",
    timeEstimate: "~3h",
    focusNote:
      "MCP 'generic-external-blog' not needed — this is mirrored on iclr-blog-track. If offline, read the equivalent on the author's GitHub (huggingface/blog or the original repo). The 'advantage normalization per mini-batch' and 'value-loss clip' details are the ones that will silently halve your training reward if you miss them. Self-check: list five of the 37 details from memory, including the two that silently halve reward (advantage normalization scope and value-loss clipping).",
    prerequisites: ["p2-ppo-paper"],
  },
  {
    id: "p2-huang-ppo-details-blog",
    title: "Costa Huang — 37 PPO Implementation Details (canonical blog)",
    type: "Blog post",
    phase: 2,
    track: "RLHF",
    url: "https://huggingface.co/blog/the_n_implementation_details_of_rlhf_with_ppo",
    timeEstimate: "~1h (reference)",
    focusNote:
      "The HuggingFace mirror is the one you'll cite in code review. Bookmark it; the 'orthogonal initialization at the last layer with small gain' detail is the kind of thing you'll stare at for two days if you don't know it exists. Self-check: state the recommended last-layer init (orthogonal, gain ≈ 0.01) and explain in one sentence why a unit-gain init breaks early PPO training.",
    prerequisites: ["p2-costa-huang-37-details"],
  },
  {
    id: "p2-christiano-preference-rl",
    title: "Deep Reinforcement Learning from Human Preferences (Christiano et al. 2017)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/1706.03741",
    timeEstimate: "~2h",
    focusNote:
      "The Bradley-Terry preference model that underlies every RLHF reward model starts here. Read §2.2 carefully — the Atari and MuJoCo experiments feel dated, but the preference-likelihood form is exactly what DPO later shortcuts. Self-check: write the Bradley-Terry preference probability P(y_w ≻ y_l | x) = σ(r(x,y_w) − r(x,y_l)) and identify it inside the DPO loss in one breath.",
    prerequisites: ["p1-instructgpt"],
  },
  {
    id: "p2-ouyang-ppo-details",
    title: "Secrets of RLHF in Large Language Models Part I (Zheng et al. 2023)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/2307.04964",
    timeEstimate: "~2h",
    focusNote:
      "A concrete, unvarnished account of what broke when Tsinghua's team rebuilt InstructGPT: reward-hacking modes, value-loss explosions, advantage scaling bugs. Read this before you try to run PPO yourself; it saves a week of debugging. Self-check: name three concrete failure modes from the paper and the mitigation each one suggests, no peeking.",
    prerequisites: ["p2-ppo-paper", "p2-christiano-preference-rl"],
  },
  {
    id: "p2-trlx-repo",
    title: "CarperAI / trlx — library for RLHF",
    type: "Code project",
    phase: 2,
    track: "RLHF",
    url: "https://github.com/CarperAI/trlx",
    timeEstimate: "~2h reading",
    focusNote:
      "Not actively maintained, but the code is the clearest mapping from PPO paper to LM-shaped PPO that exists. Read ppo_trainer.py specifically — the per-token advantage broadcast is subtle and worth staring at once. Self-check: explain how a scalar reward at end-of-sequence becomes a per-token advantage in trlx, and which tensor shape mismatch will silently zero your gradient.",
    prerequisites: ["p2-ppo-paper"],
  },
  {
    id: "p2-trl-hf",
    title: "HuggingFace TRL — ppo_trainer.py",
    type: "Code project",
    phase: 2,
    track: "RLHF",
    url: "https://github.com/huggingface/trl",
    timeEstimate: "~2h reading",
    focusNote:
      "The maintained successor to trlx. Read `trl/trainer/ppo_trainer.py` alongside the paper; the KL controller (adaptive vs fixed) and the response-token masking are the two places where production diverges from the textbook. Self-check: describe the adaptive KL controller's update rule in one sentence and explain why response-token masking matters for prompt+completion training.",
    prerequisites: ["p2-trlx-repo"],
  },
  {
    id: "p2-ultrafeedback",
    title: "UltraFeedback: Boosting LMs with High-quality Feedback (Cui et al. 2023)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/2310.01377",
    timeEstimate: "~1h",
    focusNote:
      "Read for the dataset construction recipe — 64k prompts × 4 responses × GPT-4 judge. You'll re-use this exact shape for your Phase 2 RM project, and the known label-noise characteristics matter for calibration later. Self-check: state UltraFeedback's prompt count, response-per-prompt count, and judge model from memory, plus one known label-noise pathology.",
    prerequisites: ["p2-christiano-preference-rl"],
  },
  {
    id: "p2-reward-model-length-bias",
    title: "A Long Way to Go: Investigating Length Correlations in RLHF (Singhal et al. 2023)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/2310.03716",
    timeEstimate: "~1.5h",
    focusNote:
      "Length bias is the textbook example of reward hacking. Know the three mitigations this paper evaluates (length-debiased RM, length-penalty at RL time, truncation) and which works best — this is an interview-favorite RLHF question. Self-check: rank the three length-bias mitigations by how well they recover non-length-controlled win rate, and name the one Singhal recommends.",
    prerequisites: ["p2-christiano-preference-rl"],
  },
  {
    id: "p2-rm-calibration",
    title: "West-of-N: Synthetic Preferences for Self-Improving Reward Models",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/2401.12086",
    timeEstimate: "~1h",
    focusNote:
      "Useful exemplar of how to check RM calibration (ECE on held-out preferences, not just top-1 accuracy). Skim for the calibration protocol; the main result is less important than the evaluation recipe. Self-check: define ECE for a binary preference RM in one line, and explain why top-1 accuracy alone hides miscalibration that bites you under PPO.",
    prerequisites: ["p2-ultrafeedback"],
  },
  {
    id: "p2-project-rm-ppo",
    title: "Project: Train a 1B Reward Model on UltraFeedback + PPO a small LM",
    type: "Code project",
    phase: 2,
    track: "RLHF",
    url: "https://github.com/huggingface/trl",
    timeEstimate: "~20h",
    focusNote:
      "End-to-end gauntlet for Phase 2. Use TRL's reward_trainer.py → ppo_trainer.py on a 1B model (e.g. Pythia-1B). Measure: RM eval accuracy, KL to reference, reward hacking signs. If your KL flatlines at 0 the value function is broken — debug before tuning. Self-check: list four metrics you would log every PPO step and the one diagnostic plot that lets you spot reward hacking before reward saturates.",
    prerequisites: [
      "p2-ppo-paper",
      "p2-huang-ppo-details-blog",
      "p2-trl-hf",
      "p2-ultrafeedback",
    ],
  },
  {
    id: "p2-secrets-part2",
    title: "Secrets of RLHF Part II: Reward Modeling (Wang et al. 2024)",
    type: "Paper",
    phase: 2,
    track: "RLHF",
    url: "https://arxiv.org/abs/2401.06080",
    timeEstimate: "~1.5h",
    focusNote:
      "Focuses on the RM side specifically: noise, contrastive pretraining, margin losses. Read before scaling your RM past a few hundred M params; the noisy-label tricks here are what the frontier labs actually ship. Self-check: name the margin-loss variant the paper recommends and explain in one sentence how it changes gradient behavior on noisy preference labels.",
    prerequisites: ["p2-project-rm-ppo"],
  },

  // ──────────────────────────────────────────────────────────────────────
  // Phase 3 — DPO family & Constitutional AI
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "p3-dpo-paper",
    title: "Direct Preference Optimization (Rafailov et al. 2023)",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2305.18290",
    timeEstimate: "~2h",
    focusNote:
      "Derive §4 yourself, line by line: RLHF objective → closed-form optimal policy under KL constraint → Bradley-Terry likelihood → partition function cancels in the ratio. If you can re-derive it, you understand why DPO needs no value network and no sampling at train time. Self-check: re-derive the DPO loss from the KL-constrained RLHF objective in five lines, and pinpoint the line where Z(x) cancels.",
    prerequisites: ["p2-ppo-paper", "p2-christiano-preference-rl"],
  },
  {
    id: "p3-ipo-paper",
    title: "A General Theoretical Paradigm to Understand Learning from Human Preferences (IPO)",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2310.12036",
    timeEstimate: "~1.5h",
    focusNote:
      "IPO is DPO's bias-corrected sibling. The key insight: DPO's loss is unbounded when preferences are deterministic, which causes overfitting on clean data. IPO's root-finding loss is bounded — read the overfitting discussion in §5. Self-check: explain in one sentence why DPO overfits on deterministic preferences and write the form of IPO's bounded loss.",
    prerequisites: ["p3-dpo-paper"],
  },
  {
    id: "p3-kto-paper",
    title: "KTO: Model Alignment as Prospect Theoretic Optimization",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2402.01306",
    timeEstimate: "~1.5h",
    focusNote:
      "KTO drops the paired-preference requirement — it only needs binary thumbs up/down. Read for the prospect-theory motivation (asymmetric value function, loss aversion) and the practical win: easier data collection. Self-check: explain in one sentence why KTO can use unpaired binary feedback while DPO cannot, and name the prospect-theory parameter that controls loss aversion.",
    prerequisites: ["p3-dpo-paper"],
  },
  {
    id: "p3-simpo",
    title: "SimPO: Simple Preference Optimization with a Reference-Free Reward",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2405.14734",
    timeEstimate: "~1h",
    focusNote:
      "SimPO drops the reference model at train time by using length-normalized log-likelihood as the implicit reward. The length-normalization trick is the headline — and it's also what gets debated (is it helping or just length-biasing again?). Self-check: write SimPO's reward as a function of (1/|y|) Σ log π(y|x) and argue in one sentence whether the length normalization is principled or a stealth length penalty.",
    prerequisites: ["p3-dpo-paper"],
  },
  {
    id: "p3-dpo-vs-ppo",
    title: "Is DPO Superior to PPO for LLM Alignment? A Comprehensive Study (Xu et al. 2024)",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2404.10719",
    timeEstimate: "~1.5h",
    focusNote:
      "The honest comparison. PPO wins on reasoning-heavy benchmarks when tuned well; DPO wins on data-efficiency and simplicity. Know which axis each method dominates — this question comes up in every RLHF interview. Self-check: name one benchmark where the paper shows PPO beats DPO and one where DPO matches or wins, with the rough magnitude of the gap.",
    prerequisites: ["p3-dpo-paper", "p2-ppo-paper"],
  },
  {
    id: "p3-cai-paper",
    title: "Constitutional AI: Harmlessness from AI Feedback (Bai et al. 2022)",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2212.08073",
    timeEstimate: "~2.5h",
    focusNote:
      "Read for the two-stage recipe: SL-CAI (critique + revise with a list of principles) then RL-CAI (AI-labeled preferences). This is the first production-scale 'RLAIF' paper — understand where humans are still in the loop (writing the constitution) and where they're not. Self-check: describe the SL-CAI critique-then-revise loop in one sentence and identify exactly which artifact still requires human authorship.",
    prerequisites: ["p1-instructgpt"],
  },
  {
    id: "p3-rlaif-paper",
    title: "RLAIF: Scaling Reinforcement Learning from Human Feedback with AI Feedback",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2309.00267",
    timeEstimate: "~1.5h",
    focusNote:
      "Google's head-to-head: RLAIF matches RLHF on summarization with no human labels. Read Table 2 carefully; the 'same-sized rater and policy' ablation is where RLAIF's story gets nuanced. Self-check: explain in one sentence what happens to RLAIF's win rate when the rater is the same size as the policy, and why that result complicates the 'AI labels are free' narrative.",
    prerequisites: ["p3-cai-paper"],
  },
  {
    id: "p3-self-rewarding",
    title: "Self-Rewarding Language Models (Yuan et al. 2024)",
    type: "Paper",
    phase: 3,
    track: "RLHF",
    url: "https://arxiv.org/abs/2401.10020",
    timeEstimate: "~1h",
    focusNote:
      "Meta's riff on CAI: the policy is also the judge, iterated. Watch for the reward-hacking modes in the later iterations — this paper is also an honest case study in what goes wrong when you let an LM grade itself unchecked. Self-check: name two failure modes that emerge by iteration 3 of self-rewarding and explain why grounding signals (length, format) drift fastest.",
    prerequisites: ["p3-rlaif-paper"],
  },
  {
    id: "p3-dpo-project",
    title: "Project: Implement DPO from scratch, compare to your Phase 2 PPO run",
    type: "Code project",
    phase: 3,
    track: "RLHF",
    url: "https://github.com/huggingface/trl",
    timeEstimate: "~15h",
    focusNote:
      "Use the same base model and preference dataset as the Phase 2 project. Compare: AlpacaEval-LC win rate, training throughput, and KL trajectory. The expected result (DPO trains faster, PPO wins slightly on reasoning) mirrors p3-dpo-vs-ppo — see if your run reproduces it. Self-check: predict the relative AlpacaEval-LC delta between your DPO and PPO runs before training, then explain afterward what the actual delta says about your data and tuning.",
    prerequisites: ["p3-dpo-paper", "p2-project-rm-ppo"],
  },
  {
    id: "p3-lambert-dpo-pitfalls",
    title: "Interconnects — DPO isn't a free lunch (Nathan Lambert)",
    type: "Blog post",
    phase: 3,
    track: "RLHF",
    url: "https://www.interconnects.ai/p/why-reward-models-matter",
    timeEstimate: "~30m",
    focusNote:
      "The counter-narrative to 'just use DPO'. Frontier labs still ship PPO + explicit RM for a reason — this post unpacks the 'reward model as a caching layer' mental model. Short, worth it, canonically cited in interviews. Self-check: state Lambert's 'reward model as a caching layer' argument in two sentences and name one frontier-lab signal that DPO would lose access to.",
    prerequisites: ["p3-dpo-paper"],
  },

  // ──────────────────────────────────────────────────────────────────────
  // Phase 4 — Reasoning RL (PRMs, GRPO, R1)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "p4-lets-verify",
    title: "Let's Verify Step by Step (Lightman et al. 2023)",
    type: "Paper",
    phase: 4,
    track: "RLHF",
    url: "https://arxiv.org/abs/2305.20050",
    timeEstimate: "~2h",
    focusNote:
      "The PRM vs ORM showdown. Read §4 for the PRM800K labeling protocol and §5 for the result (PRM > ORM on MATH, by a lot). The 'process supervision generalizes better out of distribution' claim is the load-bearing one. Self-check: define PRM and ORM in one line each, and explain why process supervision is hypothesized to generalize OOD better than outcome supervision.",
    prerequisites: ["p2-christiano-preference-rl"],
  },
  {
    id: "p4-math-shepherd",
    title: "Math-Shepherd: Verifying and Reinforcing LLMs Step-by-step without Human Annotations",
    type: "Paper",
    phase: 4,
    track: "RLHF",
    url: "https://arxiv.org/abs/2312.08935",
    timeEstimate: "~1.5h",
    focusNote:
      "How to build a PRM without human labels: Monte-Carlo rollouts from each prefix, success rate as the step-level reward signal. Everyone's follow-on reasoning-RL work reuses this automatic-PRM idea — know the trick. Self-check: describe Math-Shepherd's automatic step-label procedure in three steps, and name one source of label noise it introduces vs human PRM800K labels.",
    prerequisites: ["p4-lets-verify"],
  },
  {
    id: "p4-deepseekmath-grpo",
    title: "DeepSeekMath: Pushing the Limits of Mathematical Reasoning (GRPO paper)",
    type: "Paper",
    phase: 4,
    track: "RLHF",
    url: "https://arxiv.org/abs/2402.03300",
    timeEstimate: "~2h",
    focusNote:
      "GRPO is introduced in §4.1: group of G samples per prompt, advantage = (r - mean)/std within the group, no value network. Derive it on paper and compare to PPO's advantage — the memory savings are why R1 could be trained on 8× fewer GPUs than a naive PPO would need. Self-check: write GRPO's group-relative advantage formula and quantify the GPU-memory savings vs PPO when the value model is the same size as the policy.",
    prerequisites: ["p2-ppo-paper"],
  },
  {
    id: "p4-deepseek-r1",
    title: "DeepSeek-R1: Incentivizing Reasoning Capability via RL (2025)",
    type: "Paper",
    phase: 4,
    track: "RLHF",
    url: "https://arxiv.org/abs/2501.12948",
    timeEstimate: "~3h",
    focusNote:
      "The 2025 inflection paper. Read §2.2 (R1-Zero, pure RL from base with rule-based reward), §2.3 (the cold-start recipe for R1), and §3 (distillation). The 'aha moment' emergent behavior in Figure 3 is what the whole field is chasing now. Self-check: distinguish R1-Zero from R1 in one sentence, then describe the cold-start recipe and the emergent reflection behavior shown in Figure 3.",
    prerequisites: ["p4-deepseekmath-grpo", "p4-lets-verify"],
  },
  {
    id: "p4-rule-based-rewards",
    title: "Rule Based Rewards for Language Model Safety (Mu et al., NeurIPS 2024)",
    type: "Paper",
    phase: 4,
    track: "RLHF",
    url: "https://arxiv.org/abs/2411.01111",
    timeEstimate: "~1h",
    focusNote:
      "OpenAI's RBR work: hand-authored proposition rules + a small judge model, used in place of a human-preference RM for safety-critical behaviors. Read §3 for the rule format and §5 for the 'less over-refusal than a preference RM' result — this is the non-math cousin of GRPO's verifiable-reward idea. Self-check: state the RBR proposition format in one sentence and explain in another why hand-authored rules over-refuse less than a preference RM in the safety regime.",
    prerequisites: ["p4-deepseekmath-grpo"],
  },
  {
    id: "p4-open-r1",
    title: "HuggingFace — Open-R1: fully open reproduction of DeepSeek-R1",
    type: "Code project",
    phase: 4,
    track: "RLHF",
    url: "https://github.com/huggingface/open-r1",
    timeEstimate: "~3h reading",
    focusNote:
      "The open reproduction effort. Read the training scripts and dataset pipeline — the 'generate N, verify, compute GRPO advantage' loop is the cleanest reference implementation of R1-style training you'll find outside the paper. Self-check: trace one batch through open-r1's GRPO trainer in three steps (generate, verify, advantage) and name the file in the repo where each step lives.",
    prerequisites: ["p4-deepseek-r1"],
  },
  {
    id: "p4-verl",
    title: "Bytedance VeRL — Volcano Engine Reinforcement Learning for LLMs",
    type: "Code project",
    phase: 4,
    track: "RLHF",
    url: "https://github.com/volcengine/verl",
    timeEstimate: "~2h reading",
    focusNote:
      "Production-grade GRPO/PPO trainer. Read the hybrid-engine design (actor co-located with inference) — this is the architectural pattern you'll see across frontier-lab RL stacks, including the one you'll eventually work on. Self-check: explain VeRL's hybrid-engine actor-inference colocation in one sentence and name the GPU-utilization win it buys over a separate-engine baseline.",
    prerequisites: ["p4-open-r1"],
  },
  {
    id: "p4-project-grpo-gsm8k",
    title: "Project: GRPO on GSM8K with a rule-based verifier",
    type: "Code project",
    phase: 4,
    track: "RLHF",
    url: "https://github.com/huggingface/open-r1",
    timeEstimate: "~15h",
    focusNote:
      "Start from open-r1's GRPO script. Reward = (final_answer == gold). Measure pass@1 before/after and the emergence of multi-step reasoning in sampled responses. If your KL explodes, your entropy bonus is off — check it before blaming GRPO. Self-check: predict the pass@1 lift from GRPO on GSM8K with a 1B base, then list the two hyperparameters you would tune first if KL explodes.",
    prerequisites: ["p4-deepseekmath-grpo", "p4-open-r1"],
  },
  {
    id: "p4-prm-vs-orm-lambert",
    title: "Interconnects — Process vs Outcome reward models, explained",
    type: "Blog post",
    phase: 4,
    track: "RLHF",
    url: "https://www.interconnects.ai/p/openais-reinforcement-finetuning",
    timeEstimate: "~45m",
    focusNote:
      "Pragmatic take on when PRMs are worth the labeling cost versus just using outcome rewards with more rollouts. Lambert's heuristic ('if you can afford to generate 64 rollouts, you rarely need a PRM') is field-tested and worth internalizing. Self-check: state Lambert's 64-rollouts heuristic and explain in one sentence the regime where PRMs still pay off despite generous rollout budgets.",
    prerequisites: ["p4-lets-verify"],
  },

  // ──────────────────────────────────────────────────────────────────────
  // Phase 5 — Specialization: end-to-end, Tülu 3, safety, MLE-fundamentals
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "p5-tulu3",
    title: "Tülu 3: Pushing Frontiers in Open Language Model Post-Training",
    type: "Paper",
    phase: 5,
    track: "RLHF",
    url: "https://arxiv.org/abs/2411.15124",
    timeEstimate: "~3h",
    focusNote:
      "The best open account of a full post-training recipe as of late-2024. Read the three stages (SFT → DPO → RL with verifiable rewards, aka RLVR) and the dataset composition table — the mix is the recipe, not any individual algorithmic trick. Self-check: list Tülu 3's three post-training stages in order, name the data mix axis the team treats as load-bearing, and define RLVR in one sentence.",
    prerequisites: ["p3-dpo-paper", "p4-deepseekmath-grpo"],
  },
  {
    id: "p5-zero",
    title: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models",
    type: "Paper",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://arxiv.org/abs/1910.02054",
    timeEstimate: "~2h",
    focusNote:
      "Know exactly what is sharded at each stage — stage 1 optimizer states, stage 2 adds gradients, stage 3 adds parameters — and the comms cost tradeoff (stage 3 communicates parameters every forward pass). This is the textbook interview question for any post-training infra role. Self-check: name what each ZeRO stage shards, the per-step comms cost ratio between stages 2 and 3, and the regime where stage 1 alone is enough.",
    prerequisites: [],
  },
  {
    id: "p5-fsdp-tutorial",
    title: "PyTorch FSDP Tutorial (official)",
    type: "Tutorial",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://pytorch.org/tutorials/intermediate/FSDP_tutorial.html",
    timeEstimate: "~2h",
    focusNote:
      "FSDP is ZeRO-3 built into PyTorch. Run the tutorial; pay attention to MixedPrecision and auto_wrap_policy — those are the two knobs you'll tune on real models. Know how FSDP differs from DDP (param/grad sharding + gather on the fly vs replication). Self-check: contrast FSDP and DDP in one sentence (sharding vs replication), and name the auto_wrap_policy you would use for a transformer with 32 decoder layers.",
    prerequisites: ["p5-zero"],
  },
  {
    id: "p5-flashattention",
    title: "FlashAttention: Fast and Memory-Efficient Exact Attention (Dao et al. 2022)",
    type: "Paper",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://arxiv.org/abs/2205.14135",
    timeEstimate: "~2h",
    focusNote:
      "The online-softmax + tiling trick in §3.1 is the whole paper. Understand why naive attention is IO-bound (O(N^2) HBM reads), what tiling buys (reads become O(N^2/M)), and why the backward pass also needs the logsumexp cached from the forward. Self-check: explain why naive attention is HBM-bound rather than FLOP-bound, and pseudocode the online-softmax recurrence in three lines.",
    prerequisites: [],
  },
  {
    id: "p5-flashattention2",
    title: "FlashAttention-2: Faster Attention with Better Parallelism",
    type: "Paper",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://arxiv.org/abs/2307.08691",
    timeEstimate: "~1h",
    focusNote:
      "Read for the work-partitioning change: FA1 parallelized across batch×heads, FA2 adds parallelism across the sequence dimension. That's why FA2 actually hits ~50% of peak FLOPs while FA1 sat around 25%. Self-check: state which axis FA2 added parallelism on relative to FA1, and explain in one sentence why that lifts utilization from ~25% to ~50% of peak FLOPs.",
    prerequisites: ["p5-flashattention"],
  },
  {
    id: "p5-triton-tutorial",
    title: "OpenAI Triton — Matmul and FlashAttention tutorials",
    type: "Tutorial",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://triton-lang.org/main/getting-started/tutorials/index.html",
    timeEstimate: "~4h",
    focusNote:
      "Type out the matmul tutorial by hand, then the fused-attention one. You don't need to write Triton for work, but you must be able to read it — every frontier-lab perf PR is a Triton kernel, and this is the minimum-viable fluency. Self-check: define a Triton block, explain the role of tl.program_id and tl.arange in the matmul tutorial, and identify where the masked load handles the ragged tail.",
    prerequisites: ["p5-flashattention"],
  },
  {
    id: "p5-gpumode-lectures",
    title: "GPU MODE lecture series",
    type: "Video",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://www.youtube.com/@GPUMODE",
    timeEstimate: "~10h (pick 4 lectures)",
    focusNote:
      "Community GPU-perf lecture series. Must-watch: the FlashAttention-from-scratch one, the CUDA memory hierarchy one, and one Triton talk. Skip the beginner intros; you want the deep-dive implementation talks. Self-check: name the levels of the CUDA memory hierarchy from registers to HBM with rough latency, and explain why an attention kernel saturates one specific tier first.",
    prerequisites: [],
  },
  {
    id: "p5-megatron-lm",
    title: "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism",
    type: "Paper",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://arxiv.org/abs/1909.08053",
    timeEstimate: "~2h",
    focusNote:
      "Tensor-parallelism explained. Read §3 for the column/row linear-layer sharding and where the all-reduces land. When you hear '3D parallelism' (DP × TP × PP) in an infra interview, this is the TP piece. Self-check: sketch a column-then-row linear pair under TP=4 and mark where the all-reduce lands and why fusing the two avoids an extra collective.",
    prerequisites: ["p5-zero"],
  },
  {
    id: "p5-reward-hacking-survey",
    title: "Reward Hacking in Reinforcement Learning (survey, Skalse et al. 2022)",
    type: "Paper",
    phase: 5,
    track: "RLHF",
    url: "https://arxiv.org/abs/2209.13085",
    timeEstimate: "~2h",
    focusNote:
      "The formal treatment of reward hacking (definition via 'unhackable' reward functions). Read for the taxonomy — it's the right vocabulary for the safety-side framing of RLHF failures, and it's what Anthropic's RBR work builds on. Self-check: state Skalse et al.'s formal definition of an unhackable reward function and give one RLHF failure mode that maps cleanly onto their taxonomy.",
    prerequisites: ["p2-reward-model-length-bias"],
  },
  {
    id: "p5-lm-eval-harness",
    title: "EleutherAI lm-evaluation-harness",
    type: "Code project",
    phase: 5,
    track: "MLE-Fundamentals",
    url: "https://github.com/EleutherAI/lm-evaluation-harness",
    timeEstimate: "~2h reading",
    focusNote:
      "The de-facto eval stack. Read the task-definition YAML for MMLU and GSM8K; know how few-shot prompts are constructed and where the log-likelihood vs generation modes diverge. Every lab ships a fork of this. Self-check: contrast loglikelihood vs generate_until task modes in lm-eval-harness in one sentence each, and name the field in the YAML that picks between them.",
    prerequisites: [],
  },
  {
    id: "p5-alpacaeval-lc",
    title: "AlpacaEval: Length-Controlled (Dubois et al. 2024)",
    type: "Paper",
    phase: 5,
    track: "RLHF",
    url: "https://arxiv.org/abs/2404.04475",
    timeEstimate: "~1h",
    focusNote:
      "Length-controlled win rate is the eval metric DPO/PPO results are reported on in 2024–25. Read §3 for the length-correction regression trick — if you don't report LC win rate people will (correctly) assume you're gaming length. Self-check: describe the §3 length-correction regression in one sentence and explain why a model that wins on raw win-rate but loses on LC is doing length hacking.",
    prerequisites: ["p2-reward-model-length-bias"],
  },
  {
    id: "p5-capstone",
    title: "Capstone: SFT → RM → PPO/DPO on a 1B model, evaluated on MT-Bench + AlpacaEval-LC",
    type: "Code project",
    phase: 5,
    track: "RLHF",
    url: "https://github.com/huggingface/trl",
    timeEstimate: "~40h",
    focusNote:
      "The integration test for everything. Pick a 1B base (Llama-3.2-1B or Pythia-1B), run the full pipeline, and report numbers on MT-Bench + AlpacaEval-LC. Success looks like a few-point improvement on both; honest failure (a regression) is also a valid result — document it either way. Self-check: write the four-stage pipeline (SFT, RM, PPO/DPO, eval) on one line each and name the metric you would trust most if MT-Bench and AlpacaEval-LC disagree.",
    prerequisites: [
      "p2-project-rm-ppo",
      "p3-dpo-project",
      "p4-project-grpo-gsm8k",
      "p5-tulu3",
    ],
  },
];

/** Convenience lookup. Populated once at module load. */
export const CURRICULUM_BY_ID: ReadonlyMap<string, CurriculumItem> = new Map(
  CURRICULUM.map((item) => [item.id, item] as const),
);
