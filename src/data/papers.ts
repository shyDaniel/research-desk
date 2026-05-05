// src/data/papers.ts
//
// Authored canonical papers for Research Desk. Each paper has authors,
// year, venue, a real arXiv / conference URL on the same HOST_ALLOWLIST
// used by the curriculum, a 3–5 sentence editorial why-it-matters summary
// (not the paper's own abstract — this is Hanyu's research mentor telling
// him why to read it), and 5–7 pointed comprehension questions that punish
// passive reading.
//
// Invariants (enforced by src/data/__tests__/papers.test.ts):
//   - length ≥ 10
//   - every `slug` is unique and is kebab-case
//   - every `url` matches ^https?:// and its host ∈ HOST_ALLOWLIST
//   - every `summary` is ≥ 200 characters and contains no placeholder tokens
//   - every paper has between 5 and 7 questions inclusive
//   - every question id is unique within its paper and is ≥ 20 chars of prose

import { HOST_ALLOWLIST, type Track } from "./types";

export interface PaperQuestion {
  /** Stable id within the paper. Referenced by persisted answer records. */
  id: string;
  /** The actual prompt. Should test a load-bearing detail, not trivia. */
  prompt: string;
}

export interface Paper {
  /** Stable kebab-case slug, globally unique. Used in the URL /papers/[slug]. */
  slug: string;
  /** Display title. */
  title: string;
  /** Author list in "First Last, First Last, …" form. */
  authors: string;
  /** Year of first public release (arXiv v1 counts). */
  year: number;
  /** Venue or "arXiv" if never published at a conference. */
  venue: string;
  /** Canonical URL (arXiv abstract page preferred over PDF). */
  url: string;
  /** Study track; shapes how papers group on the index page. */
  track: Track;
  /**
   * 3–5 sentence editorial paragraph in the voice of a Research Engineer
   * mentor. Tells Hanyu why THIS paper is load-bearing for the OpenAI /
   * Anthropic post-training path — not what the abstract says.
   */
  summary: string;
  /** 5–7 pointed comprehension questions. */
  questions: PaperQuestion[];
}

/* -------------------------------------------------------------------------
 * The ten canonical papers.
 * Order is roughly pedagogical — the order a fresh reader should tackle.
 * ---------------------------------------------------------------------- */

export const PAPERS: ReadonlyArray<Paper> = [
  {
    slug: "instructgpt",
    title:
      "Training language models to follow instructions with human feedback (InstructGPT)",
    authors:
      "Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, John Schulman, Jacob Hilton, Fraser Kelton, Luke Miller, Maddie Simens, Amanda Askell, Peter Welinder, Paul Christiano, Jan Leike, Ryan Lowe",
    year: 2022,
    venue: "NeurIPS 2022",
    url: "https://arxiv.org/abs/2203.02155",
    track: "RLHF",
    summary:
      "This is the paper that turned RLHF from a research curiosity into a product, and it is the single most important reference for the post-training pipeline you will join. Read it for the recipe shape — SFT on demonstrations, then a Bradley-Terry reward model on comparisons, then PPO with a KL penalty to a frozen reference — and for the exact ablations that justify each stage. It also introduces the vocabulary (alignment tax, truthfulness, toxicity, helpfulness vs harmlessness) that every subsequent post-training paper assumes you already know. Treat every figure in §4 as a reference you will come back to.",
    questions: [
      {
        id: "alignment-tax",
        prompt:
          "What alignment tax did the authors observe, on which benchmarks, and what mitigation (PPO-ptx) did they propose? Be precise about the objective PPO-ptx adds.",
      },
      {
        id: "value-init",
        prompt:
          "Why do they initialise the value network from the reward model's weights rather than from the SFT policy? What goes wrong if you initialise it from the SFT policy instead?",
      },
      {
        id: "comparison-collection",
        prompt:
          "How exactly was preference-comparison data collected (K per prompt, labeler workflow, quality checks), and what known biases did the authors flag in that data? Name at least two.",
      },
      {
        id: "kl-penalty",
        prompt:
          "What role does the per-token KL penalty to the SFT reference model play in the PPO objective? Describe what happens to reward/KL curves if β is set to 0 and if β is set too high.",
      },
      {
        id: "rm-scaling",
        prompt:
          "In §6, how does the reward model's accuracy scale with model size and dataset size, and why did they choose a 6B RM to train a 175B policy rather than a 175B RM?",
      },
      {
        id: "ppo-hparams",
        prompt:
          "List the key PPO hyperparameters they used (learning rate, batch size, epochs per rollout, clip range, KL target), and explain which of these are specific to RLHF rather than standard PPO-on-Atari.",
      },
      {
        id: "truthfulqa-gain",
        prompt:
          "On TruthfulQA, what was the gain over SFT, and what does that gain tell you about what preference data is (and is not) teaching the model?",
      },
    ],
  },

  {
    slug: "ppo",
    title: "Proximal Policy Optimization Algorithms (PPO)",
    authors:
      "John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov",
    year: 2017,
    venue: "arXiv",
    url: "https://arxiv.org/abs/1707.06347",
    track: "RLHF",
    summary:
      "Every RLHF paper leans on PPO as the backbone optimizer, and the clipped surrogate objective is the one equation you have to be able to state from memory in an interview. Read it once for the algorithm, then a second time for the ablations — the paper makes a specific argument that clipping is a better trust region than a KL penalty, and that argument is load-bearing when you later debate DPO vs PPO. The Atari/MuJoCo experiments are not the point for you; the pseudocode in Algorithm 1 is.",
    questions: [
      {
        id: "clipped-objective",
        prompt:
          "Write the clipped surrogate objective L^CLIP from memory, defining every symbol. What does the clip range ε do geometrically when A>0 vs when A<0?",
      },
      {
        id: "clip-vs-kl",
        prompt:
          "Why does the paper prefer clipping over the adaptive KL-penalty variant (PPO-penalty)? Point to the specific experimental evidence.",
      },
      {
        id: "gae",
        prompt:
          "How is the advantage Â_t estimated in practice? Write the GAE(λ) formula and explain the bias-variance role of λ.",
      },
      {
        id: "multiple-epochs",
        prompt:
          "Why can PPO safely take multiple gradient epochs per rollout when vanilla policy gradient cannot? What prevents the ratio r_t(θ) from exploding?",
      },
      {
        id: "value-loss",
        prompt:
          "What is the combined loss L^CLIP+VF+S actually trained on, and what role does the entropy bonus S play? When would you set its coefficient to 0?",
      },
      {
        id: "early-stopping",
        prompt:
          "When the KL between old and new policies blows past a target, what does PPO-clip do differently from PPO-penalty? Which RLHF implementations add an explicit early-stop on KL anyway, and why?",
      },
    ],
  },

  {
    slug: "christiano-2017",
    title: "Deep Reinforcement Learning from Human Preferences",
    authors:
      "Paul Christiano, Jan Leike, Tom B. Brown, Miljan Martic, Shane Legg, Dario Amodei",
    year: 2017,
    venue: "NeurIPS 2017",
    url: "https://arxiv.org/abs/1706.03741",
    track: "RLHF",
    summary:
      "This is the origin story of preference-based RL and the direct intellectual ancestor of InstructGPT. Read it to see the core insight in its cleanest form: learn a reward model from pairwise comparisons, then optimise a policy against that learned reward. The experiments are on Atari and MuJoCo — deliberately not language — which forces you to separate the idea of RLHF from the LM-specific scaffolding. The asynchronous labeller loop (policy trains, humans label, RM updates) is the template every modern post-training stack still follows.",
    questions: [
      {
        id: "preference-likelihood",
        prompt:
          "State the Bradley-Terry-style preference likelihood used to train the reward predictor. Why a softmax over segment-sum rewards rather than a single-step reward?",
      },
      {
        id: "segments",
        prompt:
          "Why compare trajectory SEGMENTS rather than individual actions or full episodes? What does that choice buy you in terms of label efficiency and credit assignment?",
      },
      {
        id: "async-loop",
        prompt:
          "Describe the three concurrent processes (policy update, reward predictor update, human labelling) and the rate at which each runs. What breaks if they run synchronously?",
      },
      {
        id: "reward-hacking",
        prompt:
          "Section 3.5 / 4 discuss reward-model exploitation by the policy. Give one concrete example from the paper and the mitigation they applied.",
      },
      {
        id: "sample-efficiency",
        prompt:
          "How many human queries were used to match the performance of the true reward on the Atari suite, and what does that number imply for scaling RLHF on language?",
      },
      {
        id: "why-ensemble",
        prompt:
          "Why do they train an ensemble of reward predictors and use disagreement for active query selection? What is the modern analogue of this in LM RLHF pipelines?",
      },
    ],
  },

  {
    slug: "dpo",
    title:
      "Direct Preference Optimization: Your Language Model is Secretly a Reward Model (DPO)",
    authors:
      "Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Christopher D. Manning, Chelsea Finn",
    year: 2023,
    venue: "NeurIPS 2023",
    url: "https://arxiv.org/abs/2305.18290",
    track: "RLHF",
    summary:
      "DPO is the most important derivation in post-training since PPO itself — it collapses the three-stage RLHF pipeline into a single supervised-style loss. Read it with pen and paper: the derivation goes from the RLHF objective to the closed-form optimal policy, substitutes into the Bradley-Terry likelihood, and watches the partition function cancel. Once you have done that derivation once, DPO stops being magic and becomes an obvious corollary. Beyond the math, the experiments matter because they show PPO and DPO land in roughly the same quality neighbourhood, which is what justifies using DPO at all in production when compute is tight.",
    questions: [
      {
        id: "derivation",
        prompt:
          "Walk through the DPO derivation: start from the KL-regularised RLHF objective, write the closed-form optimal policy, substitute into the Bradley-Terry likelihood, and show where the partition function Z(x) cancels.",
      },
      {
        id: "beta-role",
        prompt:
          "Explain how the DPO β hyperparameter controls the geometry of the implicit reward and connect it to the KL coefficient in PPO; describe what happens as β→0 and β→∞.",
      },
      {
        id: "no-value-net",
        prompt:
          "Why does DPO not need a value network or a separate reward model at training time? What extra information does PPO have that DPO throws away?",
      },
      {
        id: "reference-policy",
        prompt:
          "DPO requires a reference policy π_ref at every training step. What is it usually set to, and what goes wrong if you set it to a uniform policy or to an early-training checkpoint?",
      },
      {
        id: "ppo-vs-dpo-experiments",
        prompt:
          "Summarise the headline PPO-vs-DPO comparison in §6. Under what conditions did DPO match or beat PPO, and where did the paper see DPO underperform?",
      },
      {
        id: "implicit-rm",
        prompt:
          "The title claims the language model is 'secretly a reward model'. Write the implicit reward expression r(x,y) implied by a DPO-trained policy, and describe one diagnostic you would run post-training using that expression.",
      },
    ],
  },

  {
    slug: "constitutional-ai",
    title: "Constitutional AI: Harmlessness from AI Feedback",
    authors:
      "Yuntao Bai, Saurav Kadavath, Sandipan Kundu, Amanda Askell, Jackson Kernion, Andy Jones, Anna Chen, Anna Goldie, Azalia Mirhoseini, Cameron McKinnon, Carol Chen, Catherine Olsson, Christopher Olah, Danny Hernandez, Dawn Drain, Deep Ganguli, Dustin Li, Eli Tran-Johnson, Ethan Perez, Jamie Kerr, Jared Mueller, Jeffrey Ladish, Joshua Landau, Kamal Ndousse, Kamile Lukosiute, Liane Lovitt, Michael Sellitto, Nelson Elhage, Nicholas Schiefer, Noemi Mercado, Nova DasSarma, Robert Lasenby, Robin Larson, Sam Ringer, Scott Johnston, Shauna Kravec, Sheer El Showk, Stanislav Fort, Tamera Lanham, Timothy Telleen-Lawton, Tom Conerly, Tom Henighan, Tristan Hume, Samuel R. Bowman, Zac Hatfield-Dodds, Ben Mann, Dario Amodei, Nicholas Joseph, Sam McCandlish, Tom Brown, Jared Kaplan",
    year: 2022,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2212.08073",
    track: "RLHF",
    summary:
      "Constitutional AI is Anthropic's flagship alignment recipe and the load-bearing paper for anyone joining Anthropic or working on safety-tuning at scale. Read it for the two-stage structure: SL-CAI, where a model critiques and revises its own responses according to a written constitution; and RL-CAI, where a preference model trained on AI-generated comparisons replaces the human labeler. The central claim — that AI feedback can substitute for human harmlessness labels without regressing on helpfulness — is what makes the Pareto frontier move. Pay attention to §3 and §4 prompts; the exact phrasings of the critique and revision instructions are the secret sauce.",
    questions: [
      {
        id: "sl-vs-rl-cai",
        prompt:
          "Lay out the SL-CAI and RL-CAI stages end-to-end. What exactly is the training signal at each stage, and why is the ordering (SL first, then RL) non-optional?",
      },
      {
        id: "constitution",
        prompt:
          "Give three concrete principles from the constitution used in the paper, and explain how each one gets applied at inference time during the self-critique step.",
      },
      {
        id: "helpfulness-preserved",
        prompt:
          "One of the paper's main claims is that CAI moves the helpfulness/harmlessness Pareto frontier. What is the experimental evidence, and what confound would you want to rule out?",
      },
      {
        id: "chain-of-thought",
        prompt:
          "Why do they use chain-of-thought reasoning in the critique-and-revise step even though the final training signal is just the revised answer? What fails if you disable CoT here?",
      },
      {
        id: "rlaif-bridge",
        prompt:
          "How does RL-CAI relate to RLAIF? Name one design choice in CAI that RLAIF later simplified or removed, and justify it.",
      },
      {
        id: "red-teaming",
        prompt:
          "What role does red-teaming play in generating the training prompts, and how does that differ from the InstructGPT-style labeler-prompt collection?",
      },
    ],
  },

  {
    slug: "deepseek-r1",
    title:
      "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
    authors:
      "DeepSeek-AI (Daya Guo, Dejian Yang, Haowei Zhang, Junxiao Song, Ruoyu Zhang, Runxin Xu, Qihao Zhu, Shirong Ma, Peiyi Wang, Xiao Bi, et al.)",
    year: 2025,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2501.12948",
    track: "RLHF",
    summary:
      "R1 is the paper that proved, in public, that rule-based-reward RL on verifiable tasks can produce a reasoning model competitive with o1-preview — no process reward model, no MCTS at training time, just GRPO with a correctness reward and a format reward. Read R1-Zero first (the pure-RL-from-base-model variant) to isolate what RL does on its own, then read R1 (cold-start SFT → RL → distillation) to see what the production pipeline looks like. Pair this with the DeepSeekMath paper to read GRPO properly; R1 assumes you know GRPO. This is the paper that defined 2025 post-training for reasoning.",
    questions: [
      {
        id: "r1-zero-vs-r1",
        prompt:
          "What is the difference between R1-Zero and R1 in terms of the training recipe? What specific failure modes of R1-Zero motivated the cold-start SFT stage that R1 adds?",
      },
      {
        id: "reward-design",
        prompt:
          "Exactly two reward signals drive R1-Zero training. Name them, describe how each is computed, and explain why they chose NOT to use a learned PRM.",
      },
      {
        id: "emergent-length",
        prompt:
          "During R1-Zero training the model's response length grows on its own. What mechanism produces that growth, and why is it a signal (not a bug)?",
      },
      {
        id: "language-mixing",
        prompt:
          "R1-Zero exhibits language mixing and reduced readability. What intervention in the R1 pipeline fixes this, and what is the cost of that intervention?",
      },
      {
        id: "distillation",
        prompt:
          "The distilled-to-Qwen variants often beat the 671B teacher on some benchmarks. What does that tell you about where R1's capability is actually stored?",
      },
      {
        id: "grpo-role",
        prompt:
          "GRPO replaces PPO's value network with group-relative advantages. Sketch the GRPO advantage formula and explain why it is particularly well-suited to reasoning RL where rewards are sparse and binary.",
      },
      {
        id: "aha-moment",
        prompt:
          "The paper highlights the 'aha moment' mid-training where the model starts re-evaluating its own reasoning. Why is this evidence that RL is doing more than amplifying priors from pre-training?",
      },
    ],
  },

  {
    slug: "lets-verify",
    title: "Let's Verify Step by Step",
    authors:
      "Hunter Lightman, Vineet Kosaraju, Yura Burda, Harri Edwards, Bowen Baker, Teddy Lee, Jan Leike, John Schulman, Ilya Sutskever, Karl Cobbe",
    year: 2023,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2305.20050",
    track: "RLHF",
    summary:
      "This paper is the canonical reference for process reward models (PRMs) vs outcome reward models (ORMs) and the PRM800K dataset is still a benchmark in 2025. Read it for three things: the PRM vs ORM experimental comparison under a best-of-N setting, the labelling protocol that produces step-level correctness annotations, and the discussion of why PRMs are more sample-efficient but more expensive to collect. When you later read DeepSeek-R1 and see them deliberately NOT use a PRM, you need this paper as background to appreciate the trade-off they are making.",
    questions: [
      {
        id: "prm-vs-orm-definition",
        prompt:
          "Give a precise definition of a process reward model vs an outcome reward model. How are labels collected for each, and how does the RM head produce its score differently?",
      },
      {
        id: "best-of-n",
        prompt:
          "In the best-of-N evaluation setting, how does a PRM aggregate step scores into a whole-solution score? Give at least two aggregation strategies and when each wins.",
      },
      {
        id: "label-efficiency",
        prompt:
          "What is the headline label-efficiency comparison between PRM800K and the corresponding ORM-only variant? Quote the relevant numbers.",
      },
      {
        id: "active-learning",
        prompt:
          "Describe the active-learning loop they used to select problems for human labeling. Why does passive uniform sampling over problems waste labeler time?",
      },
      {
        id: "mistake-detection",
        prompt:
          "How well do PRMs trained on PRM800K generalise to detecting mistakes in problems from a different distribution? What does that say about whether PRMs learn reasoning or heuristics?",
      },
      {
        id: "when-orm",
        prompt:
          "Under what conditions would you still choose an ORM over a PRM in a production pipeline, despite the sample-efficiency advantage PRMs demonstrate here?",
      },
    ],
  },

  {
    slug: "zero",
    title: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models",
    authors:
      "Samyam Rajbhandari, Jeff Rasley, Olatunji Ruwase, Yuxiong He",
    year: 2019,
    venue: "SC 2020",
    url: "https://arxiv.org/abs/1910.02054",
    track: "MLE-Fundamentals",
    summary:
      "ZeRO is THE paper on distributed optimizer-state, gradient, and parameter sharding, and FSDP is its direct descendent. Read it for the memory accounting: the paper walks through exactly how much memory the optimizer states, gradients, and parameters each consume in mixed-precision training, and then shows what each of ZeRO-1/2/3 removes. After this paper you should be able to back-of-the-envelope the memory required to train a 70B model on 8×A100 without a calculator — that is an interview-grade skill you currently lack and OpenAI training roles will test for.",
    questions: [
      {
        id: "memory-breakdown",
        prompt:
          "For a model with Ψ parameters trained in mixed precision with Adam, write out the per-GPU memory footprint of (a) parameters, (b) gradients, (c) optimizer states, under standard data parallelism. Be explicit about the 2+2+12 bytes-per-parameter Adam accounting.",
      },
      {
        id: "zero-stages",
        prompt:
          "Walk through what each of ZeRO-1, ZeRO-2, and ZeRO-3 shards across data-parallel workers, and give the per-stage memory multiplier vs plain DDP.",
      },
      {
        id: "comm-volume",
        prompt:
          "How does the communication volume change going from DDP to ZeRO-3? Use the per-step all-reduce / all-gather / reduce-scatter counts to justify your answer.",
      },
      {
        id: "ofloading",
        prompt:
          "Describe ZeRO-Offload and ZeRO-Infinity at a high level. What do they trade for the memory savings, and when is that trade a good idea vs a bad one?",
      },
      {
        id: "fsdp-vs-zero3",
        prompt:
          "PyTorch FSDP is essentially ZeRO-3 re-implemented. Name one concrete thing FSDP does differently (sharding strategy, backward prefetch, mixed-precision API, etc.) and why.",
      },
      {
        id: "tp-vs-zero3",
        prompt:
          "When would you pick tensor parallelism over ZeRO-3 despite ZeRO-3's lower engineering complexity? Frame the answer in terms of inter-node bandwidth and activation memory.",
      },
    ],
  },

  {
    slug: "flashattention",
    title:
      "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness (v1 + v2)",
    authors:
      "Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher Ré (v1); Tri Dao (v2)",
    year: 2022,
    venue: "NeurIPS 2022 / arXiv",
    url: "https://arxiv.org/abs/2205.14135",
    track: "MLE-Fundamentals",
    summary:
      "Every modern LLM trains and serves on a descendant of FlashAttention, and if you want to be taken seriously in a GPU-systems conversation you have to understand why. Read v1 for the core insight: attention is IO-bound on modern GPUs, so tiling K and V across SRAM and keeping the softmax statistics online turns an O(N²) memory algorithm into an O(N) memory algorithm without changing the math. Read v2 for the throughput story — v2 reworks the parallelism so that each thread block owns a full row block of Q, which is what actually unlocks the 2× speedup over v1 on modern hardware. Then read the Triton tutorials for how to implement something like this yourself.",
    questions: [
      {
        id: "io-bound",
        prompt:
          "Why is standard attention IO-bound rather than compute-bound on an A100? Compute the arithmetic intensity and compare it to the A100's ridge point.",
      },
      {
        id: "online-softmax",
        prompt:
          "Write the online softmax recurrence — the running max m_i and the running normaliser ℓ_i — and show why it produces the same result as the global-max softmax.",
      },
      {
        id: "tiling",
        prompt:
          "Describe the tiling strategy in FlashAttention v1. Which tensors live in HBM, which live in SRAM, and what is the inner loop order (rows of Q vs columns of K)?",
      },
      {
        id: "v2-parallelism",
        prompt:
          "What did FlashAttention v2 change about work partitioning across warps and thread blocks, and why does that change give ~2× speedup over v1? What stayed the same?",
      },
      {
        id: "backward-pass",
        prompt:
          "FlashAttention recomputes the forward-pass attention matrix during the backward pass instead of storing it. What memory saving does this give, and what compute cost does it pay?",
      },
      {
        id: "not-universal",
        prompt:
          "Name at least one attention variant (e.g. local, sliding-window, ALiBi, paged attention for serving) where FlashAttention's exact-attention assumption is either extended or violated, and describe the adjustment required.",
      },
    ],
  },

  {
    slug: "rlaif",
    title:
      "RLAIF: Scaling Reinforcement Learning from Human Feedback with AI Feedback",
    authors:
      "Harrison Lee, Samrat Phatale, Hassan Mansoor, Thomas Mesnard, Johan Ferret, Kellie Lu, Colton Bishop, Ethan Hall, Victor Carbune, Abhinav Rastogi, Sushant Prakash",
    year: 2023,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2309.00267",
    track: "RLHF",
    summary:
      "RLAIF is the paper that made 'ask a big model for preference labels' a respectable research move rather than a hack. Read it for the head-to-head: on summarisation and helpful-dialogue tasks, a preference model trained on off-the-shelf-LLM labels roughly matches one trained on human labels, under controlled conditions. Then read the discussion carefully for where this breaks — harmlessness is harder, and the direct-RLAIF variant (skipping the RM entirely and using the LLM as the reward) has its own failure modes. This paper is the intellectual bridge between Constitutional AI and the synthetic-data preference-labelling pipelines that dominate 2025 post-training.",
    questions: [
      {
        id: "setup",
        prompt:
          "Describe the RLAIF labeling procedure step by step: prompt format, chain-of-thought usage, pairwise vs pointwise, output parsing. What design decisions did the paper ablate?",
      },
      {
        id: "rlaif-vs-rlhf",
        prompt:
          "On the summarisation task, how close does RLAIF come to RLHF in win-rate? What is the size of the reward model and the labeler LLM in that comparison?",
      },
      {
        id: "direct-rlaif",
        prompt:
          "What is direct-RLAIF (d-RLAIF)? Why does it skip the reward model, and what new failure mode does that skipping create?",
      },
      {
        id: "self-improvement",
        prompt:
          "Can a model 'self-improve' if both the policy and the labeler are the same model? What does the paper say and what is the catch?",
      },
      {
        id: "position-bias",
        prompt:
          "LLM preference labelers are known to have position bias. What mitigation did the paper apply, and what residual bias could still slip through?",
      },
      {
        id: "harmless-gap",
        prompt:
          "Where does RLAIF underperform RLHF in the paper, and what is the most plausible mechanistic reason for that gap?",
      },
    ],
  },

  {
    slug: "grpo-deepseekmath",
    title:
      "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (introduces GRPO)",
    authors:
      "Zhihong Shao, Peiyi Wang, Qihao Zhu, Runxin Xu, Junxiao Song, Mingchuan Zhang, Y.K. Li, Y. Wu, Daya Guo",
    year: 2024,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2402.03300",
    track: "RLHF",
    summary:
      "This is the paper that actually introduces GRPO (Group Relative Policy Optimization) — DeepSeek-R1 uses it but does not re-derive it. Read it with the PPO paper open next to you so you can see exactly what GRPO removes (the value network) and what it replaces it with (a group mean/std baseline computed from K rollouts per prompt). The §4 ablations are the ones that matter: group size, KL coefficient, and the choice between outcome and process rewards. This is the practical RL algorithm that powers 2025 reasoning models; understanding it is table stakes.",
    questions: [
      {
        id: "grpo-advantage",
        prompt:
          "Write the GRPO advantage formula for rollout i in a group of K, and explain why group-relative standardisation works as a baseline even without a learned value function.",
      },
      {
        id: "value-net-removal",
        prompt:
          "Removing the value network saves memory and compute. What does GRPO give up by doing this? Name at least one bias and one variance consequence.",
      },
      {
        id: "group-size",
        prompt:
          "What group size K does the paper recommend, and how does the variance of the GRPO estimator scale with K? At what point do diminishing returns kick in?",
      },
      {
        id: "kl-to-ref",
        prompt:
          "GRPO retains the per-token KL penalty to a reference model. Why is this necessary, and what goes wrong on a math benchmark if you set the KL coefficient to 0?",
      },
      {
        id: "outcome-reward",
        prompt:
          "On DeepSeekMath's training data, the outcome reward is a binary correctness signal. How is that reward propagated to intermediate tokens, and what does this imply about credit assignment on long chains of thought?",
      },
      {
        id: "data-pipeline",
        prompt:
          "Describe the DeepSeekMath data pipeline that produced the SFT-then-RL training mix. Why is the quality of the pretraining math corpus (not just the RL algorithm) essential to the final numbers?",
      },
    ],
  },
] as const;

/** Lookup by slug for the per-paper page. */
export const PAPERS_BY_SLUG: ReadonlyMap<string, Paper> = new Map(
  PAPERS.map((p) => [p.slug, p])
);

/**
 * Re-export of the shared host allow-list so tests can import it from a
 * single module without pulling in the curriculum data just to get the list.
 */
export { HOST_ALLOWLIST };
