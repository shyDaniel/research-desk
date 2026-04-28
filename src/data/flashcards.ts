// src/data/flashcards.ts
//
// Authored RLHF + MLE-fundamentals flashcards. Every topic listed in
// FINAL_GOAL.md §4 ("Flashcard coverage, ≥ 30 cards, must include all of
// these topics") is represented. Answers are paragraph-length, technically
// precise, and written in a senior-IC register — no marketing gloss.

export type CardTopic =
  | "rlhf-core"
  | "ppo"
  | "dpo"
  | "reward-model"
  | "kl"
  | "grpo"
  | "reasoning-rl"
  | "cai"
  | "distributed"
  | "gpu"
  | "inference"
  | "eval"
  | "safety";

export interface Flashcard {
  id: string;
  topic: CardTopic;
  /** A short prompt — the "front" of the card. */
  front: string;
  /** The full technically-precise answer — the "back". */
  back: string;
  /** Prerequisite card ids whose concept the learner should already own. */
  prereqs?: string[];
}

/**
 * Flashcard deck. Order here is "suggested first-introduction" order — the
 * UI does NOT show cards in this order; SM-2 determines that. The order
 * only matters for the "unseen card" fallback sort.
 */
export const FLASHCARDS: ReadonlyArray<Flashcard> = [
  {
    id: "kl-forward-reverse",
    topic: "kl",
    front: "Forward vs reverse KL — which one does RLHF's KL penalty use, and why does the choice matter?",
    back:
      "Forward KL, D_KL(P‖Q) = E_P[log P/Q], is mean-seeking: if P places mass anywhere, Q is punished for assigning zero there, so the minimiser spreads mass and covers every mode of P. Reverse KL, D_KL(Q‖P), is mode-seeking: Q is punished only where IT places mass on low-P regions, so the minimiser snaps to a single high-P mode and zeroes out everywhere else. RLHF penalises D_KL(π_θ ‖ π_ref) — reverse KL with the trained policy as Q. That is deliberate: we want the policy to stay inside the plausible-text manifold of the reference model rather than uniformly hedge across it, so mode-seeking is the correct prior. Empirically this shows up as RLHF not flattening into generic slop when well-tuned, but it also explains the classic failure mode where the policy collapses onto one answer template — reverse KL does not penalise mode dropping, only moving mass to low-π_ref regions.",
  },
  {
    id: "ppo-clipped-surrogate",
    topic: "ppo",
    front: "Write the PPO clipped surrogate objective from memory and explain the clip range.",
    back:
      "L^{CLIP}(θ) = E_t[ min( r_t(θ) Â_t , clip(r_t(θ), 1-ε, 1+ε) Â_t ) ], where r_t(θ) = π_θ(a_t|s_t) / π_{θ_old}(a_t|s_t) is the importance ratio and Â_t is the GAE advantage. When Â_t > 0 (good action) the `min` caps the upside at (1+ε)Â_t — you stop being rewarded for pushing the ratio higher than 1+ε. When Â_t < 0 (bad action) the `min` keeps the full unclipped (1-ε)Â_t penalty whenever the ratio drops below 1-ε — you are not allowed to 'escape' a bad action by driving its probability to zero. Together this is a first-order trust region: gradients zero out as soon as the policy moves meaningfully (|r-1| > ε) in a direction that would overcommit, without the full Fisher-matrix machinery of TRPO. ε is typically 0.1–0.3 for language models; smaller ε = tighter trust region = more conservative updates.",
    prereqs: ["kl-forward-reverse"],
  },
  {
    id: "ppo-vs-dpo-value",
    topic: "dpo",
    front: "Why does PPO need a value function and DPO doesn't?",
    back:
      "PPO is an on-policy actor-critic RL algorithm: its policy-gradient update uses an advantage estimator Â_t = r_t - V(s_t) (or the richer GAE variant with λ). You need V to reduce variance — without subtracting a baseline the gradient magnitude is dominated by the absolute reward scale and converges slowly. The value head is usually initialised from the reward model and co-trained. DPO bypasses RL entirely: Rafailov et al. show that the RLHF objective has a closed-form optimal policy π*(y|x) ∝ π_ref(y|x) exp(r(x,y)/β), and when you plug that into the Bradley-Terry preference likelihood the reward r and the partition function Z(x) algebraically cancel, leaving a pure classification loss over (chosen, rejected) pairs expressed entirely through π_θ and π_ref log-probs. There is no sampled trajectory, no advantage, no baseline — so no value network.",
    prereqs: ["ppo-clipped-surrogate"],
  },
  {
    id: "bradley-terry",
    topic: "reward-model",
    front: "State the Bradley-Terry preference model and its log-likelihood form.",
    back:
      "Bradley-Terry assumes each item has a latent scalar 'strength' s_i and that P(i ≻ j) = σ(s_i - s_j), i.e. the logistic of the score difference. In RLHF we replace strengths with a neural reward: P(y_w ≻ y_l | x) = σ(r_φ(x, y_w) - r_φ(x, y_l)). Given a dataset of preference pairs D, the reward-model loss is the negative log-likelihood L(φ) = - E_{(x, y_w, y_l) ~ D}[ log σ(r_φ(x, y_w) - r_φ(x, y_l)) ]. Two things fall out: only score *differences* are identifiable (you can add any constant to r and the likelihood is invariant — hence RMs are always normalised or used only through differences), and the implicit noise model is Gumbel / logistic, which is what lets DPO reuse the same likelihood as its training objective without a separate RM.",
  },
  {
    id: "kl-penalty-purpose",
    topic: "kl",
    front: "What is the KL penalty to the reference policy for in RLHF, and what happens if you remove it?",
    back:
      "The per-token KL penalty β · D_KL(π_θ(·|s_t) ‖ π_ref(·|s_t)) is added to the reward (or equivalently to the loss) and is the single most important regulariser in RLHF. It exists because the reward model is only trained on the distribution of samples produced by π_ref (or by SFT near π_ref); outside that support the RM is extrapolating and its score is noise. Without the KL term, PPO will find and exploit that noise — classic failure mode is the policy producing degenerate outputs (repeated tokens, formatting tricks, specific fake-structured answers) that score very high under the RM but are incoherent or off-task. Empirically RLHF without the KL term reliably reward-hacks within a few hundred steps. β is usually 0.01–0.2; Anthropic's original CAI paper and InstructGPT both report the KL / reward tradeoff curve as the main hyperparameter to tune.",
    prereqs: ["kl-forward-reverse"],
  },
  {
    id: "dpo-derivation",
    topic: "dpo",
    front: "Sketch the DPO loss derivation end-to-end.",
    back:
      "Start from the KL-regularised RLHF objective: max_π E_{x, y~π}[r(x,y)] - β D_KL(π(·|x) ‖ π_ref(·|x)). Taking the functional derivative and solving yields the closed-form optimal policy π*(y|x) = (1/Z(x)) π_ref(y|x) exp(r(x,y)/β), where Z(x) = Σ_y π_ref(y|x) exp(r(x,y)/β) is the partition function. Rearrange for r: r(x,y) = β log (π*(y|x)/π_ref(y|x)) + β log Z(x). Now plug this into the Bradley-Terry preference likelihood σ(r(x,y_w) - r(x,y_l)): the β log Z(x) terms appear with opposite signs in both reward evaluations and CANCEL. What remains is L_DPO(θ) = - E[ log σ( β log (π_θ(y_w|x)/π_ref(y_w|x)) - β log (π_θ(y_l|x)/π_ref(y_l|x)) ) ]. No explicit reward model. No sampling. No PPO. Just a classification loss over preferred/dispreferred pairs with π_θ and π_ref log-probs as features.",
    prereqs: ["ppo-vs-dpo-value", "bradley-terry"],
  },
  {
    id: "grpo-advantage",
    topic: "grpo",
    front: "Write GRPO's advantage formula and explain why it does away with the value network.",
    back:
      "GRPO (Group Relative Policy Optimization, introduced in DeepSeekMath and re-applied in DeepSeek-R1) replaces the value-network baseline with a *group* baseline: for each prompt x, sample G completions {y_1..y_G} from π_old, score them with r_i, and compute Â_i = (r_i - mean(r)) / std(r). Each token in y_i inherits that sequence-level advantage. Because the baseline (group mean) and the variance scaling (group std) both come from the sampled group, there is no value function to train — so no critic initialisation from the RM, no V-head, no GAE. The cost is that you pay G× forward passes per prompt, but G=4–16 is cheap when the reward is deterministic (math / code unit tests), which is exactly where GRPO was designed to shine. The policy loss itself is still PPO-style clipped surrogate plus a KL-to-ref term; GRPO only changes how the advantage is computed.",
    prereqs: ["ppo-clipped-surrogate"],
  },
  {
    id: "prm-vs-orm",
    topic: "reasoning-rl",
    front: "Process reward model vs outcome reward model — when is each appropriate?",
    back:
      "An ORM scores only the final answer (correct / incorrect or a scalar 'quality'). A PRM scores each intermediate reasoning step individually. 'Let's Verify Step by Step' (Lightman et al. 2023) showed PRMs materially beat ORMs on MATH when used as verifiers during best-of-N search, because they localise the credit / blame assignment: on a wrong multi-step proof, the ORM tells you only that something went wrong; the PRM identifies WHICH step broke, which is far more informative both for training and for inference-time rejection sampling. PRMs are expensive — they need step-level human labels or synthetic ones from Math-Shepherd-style rollouts. Use an ORM when the task has a cheap deterministic checker (code unit tests, exact-match math answers — exactly the GRPO regime), and use a PRM when credit assignment is hard, reasoning chains are long, and you can afford the step-level labelling cost.",
  },
  {
    id: "zero-stages",
    topic: "distributed",
    front: "ZeRO stages 1, 2, 3 — what is sharded at each stage, and what is the memory win?",
    back:
      "Training memory for a model with Ψ parameters in fp16 with Adam is dominated by three things replicated across every data-parallel rank: optimizer state (≈12Ψ bytes — fp32 master weights + m + v), gradients (2Ψ bytes fp16), and parameters (2Ψ bytes fp16), totalling ≈16Ψ bytes per rank. ZeRO-1 shards ONLY the optimizer state across N ranks → (12Ψ/N + 2Ψ + 2Ψ). ZeRO-2 additionally shards the gradients → (12Ψ/N + 2Ψ/N + 2Ψ). ZeRO-3 also shards the parameters themselves → (16Ψ/N), with an all-gather before each forward and each backward op. The communication cost grows accordingly: ZeRO-1 is identical to DDP in bandwidth; ZeRO-2 adds reduce-scatter instead of all-reduce; ZeRO-3 doubles parameter traffic. FSDP in PyTorch is essentially ZeRO-3 with nicer ergonomics.",
  },
  {
    id: "fsdp-vs-ddp",
    topic: "distributed",
    front: "FSDP vs DDP — describe the parameter, gradient, and optimizer-state behaviour.",
    back:
      "DDP replicates the full model on every rank: forward and backward are purely local; at the end of backward each rank all-reduces its gradients so every replica has the same averaged gradient; the optimizer step is local and independent. Memory per rank scales as O(Ψ) and never shrinks with data-parallel size. FSDP ('Fully Sharded Data Parallel') shards parameters, gradients, and optimizer state across the data-parallel group. Forward: for each layer, all-gather its parameters from all ranks, compute, then discard the non-owned shard. Backward: all-gather again for gradient computation, reduce-scatter the gradients so each rank ends up with only its own shard's gradient. Optimizer step is local on the owned shard. Memory per rank is O(Ψ/N) but communication volume is roughly 1.5× DDP. FSDP is the right choice whenever a single model replica doesn't fit in a single GPU's memory.",
    prereqs: ["zero-stages"],
  },
  {
    id: "activation-checkpointing",
    topic: "gpu",
    front: "Activation checkpointing — the memory-compute tradeoff.",
    back:
      "During backward, the autograd graph needs every layer's forward activations to compute gradients. For a transformer with L layers and sequence length T, the activation memory is O(L · T · H) for hidden size H — at long contexts this dominates total memory. Activation checkpointing drops intermediate activations at forward time and RECOMPUTES them during backward by re-running the forward of each checkpointed segment. With uniform checkpointing every K layers you cut activation memory by a factor of K at the cost of one extra forward pass per training step (≈ 33% more FLOPs for K = L, i.e. one checkpoint per layer). The canonical recipe from Chen et al. 2016 is to checkpoint √L segments for an O(√L) memory / 1.33× compute tradeoff. In practice every modern transformer trainer — FSDP, Megatron, DeepSpeed — ships this on by default for anything past ≈ 1B params at long context.",
  },
  {
    id: "bf16-vs-fp16",
    topic: "gpu",
    front: "bf16 vs fp16 — which wins for training, and why?",
    back:
      "Both are 16-bit floats, but the bit budget is different. fp16 (IEEE half): 1 sign, 5 exponent, 10 mantissa — range roughly ±6.5e4, ~3 decimal digits of precision. bf16 (Google Brain): 1 sign, 8 exponent, 7 mantissa — same exponent range as fp32 (±3.4e38) but coarser precision. For training, dynamic range matters more than precision: gradient magnitudes span many orders of magnitude and a single underflow or overflow kills training. fp16 requires loss scaling machinery (dynamic, per-layer, sometimes per-tensor) to avoid gradient underflow. bf16 just works — no loss scaling, same range as fp32 — at the cost of slightly noisier accumulation, which matmul accumulate-in-fp32 completely absorbs. Every modern training stack (Megatron, FSDP, DeepSpeed) defaults to bf16 on Ampere+ / Hopper / TPU. fp16 survives mostly in inference, where loss scaling isn't needed and the extra precision sometimes helps small-scale activations.",
  },
  {
    id: "kv-cache-memory",
    topic: "inference",
    front: "Give the KV cache memory formula for a decoder-only transformer.",
    back:
      "For one sequence of length T, the KV cache stores K and V tensors for every layer and every attention head. Memory (bytes) = 2 · L · T · n_kv · d_head · b, where L is number of layers, T is sequence length, n_kv is the number of KV heads (with MHA this equals the number of query heads; with GQA it is smaller; with MQA it is 1), d_head is per-head dimension, b is bytes per element (2 for fp16/bf16). The leading 2 is for K and V. Example: Llama-3 70B (L=80, n_kv=8, d_head=128) at T=8192 in bf16 = 2·80·8192·8·128·2 = 2.68 GB PER SEQUENCE. This is why batch sizes in inference are KV-cache-bound, why GQA/MQA exist, why vLLM's PagedAttention (4K-block paging) was worth a paper — memory fragmentation around dynamic T is the binding constraint on throughput.",
  },
  {
    id: "continuous-batching",
    topic: "inference",
    front: "vLLM's 'continuous batching' — the key insight.",
    back:
      "Classical static batching groups N requests together, runs the whole batch through prefill + decode, and cannot accept a new request until every sequence in the batch has finished. If sequences have very different lengths (99th percentile vs mean, typical for LLM traffic), GPUs sit idle while the shortest-finishing sequences wait for the longest. Continuous batching (Orca, 2022; popularised by vLLM) schedules at the *iteration* granularity: after every single decode step, finished sequences exit the batch and new queued requests are prefilled and joined in their place, subject to available KV-cache budget. The batch size is elastic, GPU utilisation stays high across heterogeneous traffic, and p50/p99 latency both drop. The combination of continuous batching + PagedAttention is why vLLM gets ~2-4× the throughput of naive HF pipelines on the same hardware.",
    prereqs: ["kv-cache-memory"],
  },
  {
    id: "flash-attention",
    topic: "gpu",
    front: "FlashAttention — the online-softmax + tiling idea, and why it matters.",
    back:
      "Standard attention materialises the full (T×T) attention matrix in HBM: compute QK^T (T×T), softmax row-wise, then multiply by V. For long T this is both O(T²) memory and HBM-bandwidth-bound because the T×T matrix is written out and read back in. FlashAttention (Dao et al. 2022) uses a Bc×Br tile of Q, K, V held in on-chip SRAM and computes the softmax ONLINE using running max and running denominator statistics — the classic numerical trick of rescaling the accumulated output when a new max is discovered. No T×T matrix is ever materialised; the kernel fuses matmul → softmax → matmul in a single pass, which turns attention from memory-bound into compute-bound on modern GPUs. FA2 (2023) further improves the kernel by better parallelisation across warps and the Q/K tile split, getting closer to peak tensor-core FLOPs. The combined effect is 2-4× training speedup and the ability to go to long context without blowing HBM.",
    prereqs: ["activation-checkpointing"],
  },
  {
    id: "speculative-decoding",
    topic: "inference",
    front: "Speculative decoding — how does the draft/verify mechanic work?",
    back:
      "A cheap draft model generates K candidate tokens autoregressively. The target (big) model then scores those K tokens IN PARALLEL in a single forward pass, getting p_target(t_i | x, t_1..t_{i-1}) for every i. Starting from i=1, accept t_i with probability min(1, p_target(t_i)/p_draft(t_i)); as soon as one token is rejected, resample that position from the properly-normalised residual max(0, p_target - p_draft) and throw away the rest. This guarantees the output distribution is EXACTLY the target model's — it is a bias-free speedup, not an approximation. Expected tokens-per-target-call goes from 1 to roughly E[accepted] + 1 (typically 2-4 when draft and target agree often), which is the speedup. The draft model has to be fast AND well-correlated with the target; common choices are a small same-family LLM or a tuned 'Medusa' / n-gram head.",
  },
  {
    id: "reward-hacking",
    topic: "safety",
    front: "Reward hacking — define it and give three mitigations.",
    back:
      "Reward hacking is when a policy achieves high measured reward by exploiting a misspecification in the reward function rather than by performing the underlying task well. In RLHF this shows up as: the policy finds formatting tricks, verbose padding, canned reassurance, or sycophantic agreement that the RM scores highly because those patterns correlate with preferred outputs in the training data. Mitigations: (1) KL penalty to a frozen reference policy, which limits how far the policy can drift from in-distribution text where the RM is actually calibrated; (2) reward-model ensembling or uncertainty estimation — penalise the policy on high-disagreement samples because those are where the RM is likely to be extrapolating; (3) re-collect preference data on the post-RLHF policy's own samples (iterative RLHF / 'batch' updates, as in InstructGPT) so the RM stays on-distribution with the policy; additionally rule-based verifiable rewards (GRPO on math/code) sidestep the problem entirely when the task admits an exact checker.",
    prereqs: ["kl-penalty-purpose"],
  },
  {
    id: "length-bias",
    topic: "reward-model",
    front: "Length bias in reward models — cause and at least two mitigations.",
    back:
      "Preference annotators, both human and synthetic, tend to prefer longer responses when they cannot tell which is substantively better — more words look more effortful / more thorough. The RM picks this up as a strong signal; during PPO the policy then discovers it can raise reward just by padding, and response length balloons with no corresponding quality gain. Mitigations: (1) length normalisation — subtract a learned length term from the RM's score, or regress out length at training time using a simple tok-count feature; AlpacaEval-LC (length-controlled) is the eval-side version of the same idea. (2) SimPO / regularised-preference losses that explicitly penalise the length difference between chosen and rejected in the preference loss, so the RM cannot trivially assign higher reward just because y_w is longer. (3) Curate preference data to balance lengths within each (x, y_w, y_l) tuple so the signal the RM can fit is only the substantive one. Nathan Lambert's 'reward models still matter' posts are the canonical tour of this problem.",
    prereqs: ["bradley-terry"],
  },
  {
    id: "constitutional-ai",
    topic: "cai",
    front: "Constitutional AI — the two-stage SL-CAI + RL-CAI recipe.",
    back:
      "Stage 1 (SL-CAI — Supervised CAI): Starting from a helpful-only assistant, prompt it to produce responses to harmful-ish prompts, then prompt the SAME model to CRITIQUE its own response against a written 'constitution' (a handful of principles, e.g. 'do not help with illegal acts', 'be helpful and harmless'), then prompt it to REVISE the response given the critique. Fine-tune the base on (prompt → final revised response) pairs. Result: a helpful+harmless SFT model without any new human harmlessness labels. Stage 2 (RL-CAI — RL from AI Feedback for harmlessness): Sample pairs of responses from the SL-CAI model, have the model itself choose which one better follows the constitution (this gives synthetic preference data), train a harmlessness RM on that, and run standard RLHF against a blended helpfulness + harmlessness reward. Net: the only human labels used are for helpfulness; harmlessness is bootstrapped via the model's own critique-and-revise loop guided by the written constitution. This is the recipe behind Claude's original training.",
    prereqs: ["kl-penalty-purpose"],
  },
  {
    id: "gae",
    topic: "ppo",
    front: "GAE — explain the bias / variance tradeoff via λ.",
    back:
      "Generalised Advantage Estimation: Â^{GAE(γ,λ)}_t = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}, where δ_t = r_t + γ V(s_{t+1}) - V(s_t) is the one-step TD error. λ = 0 collapses to Â_t = δ_t, i.e. the pure one-step bootstrap: low variance (one random sample) but biased by the accuracy of V. λ = 1 collapses to Â_t = Σ γ^l r_{t+l} - V(s_t), i.e. the Monte-Carlo return minus baseline: unbiased (no reliance on a learned V beyond as a baseline) but high variance (full trajectory noise). Intermediate λ interpolates. Typical PPO-language-model settings use γ = 1 (undiscounted, short trajectories) and λ ≈ 0.95 — most of the variance reduction of low λ with almost all the bias correction of MC returns. Raising λ is the right move when V is noisy / poorly trained; lowering λ is right when V is well-calibrated and you need the variance reduction.",
    prereqs: ["ppo-clipped-surrogate"],
  },
  {
    id: "importance-sampling",
    topic: "ppo",
    front: "Importance sampling in off-policy RL — what is it doing in PPO?",
    back:
      "When you want to estimate E_{a~π_target}[f(a)] but your samples come from π_behavior, multiply by the importance ratio: E_{a~π_behavior}[ (π_target(a) / π_behavior(a)) f(a) ] = E_{a~π_target}[f(a)]. This gives an unbiased estimator at the cost of variance that grows with the ratio's variance. In PPO specifically, each rollout is collected under π_{θ_old} but the K inner gradient epochs update π_θ — so inside those inner epochs we are off-policy with respect to the rollout, and the ratio r_t(θ) = π_θ(a_t|s_t)/π_{θ_old}(a_t|s_t) is exactly the importance-sampling correction. This is why PPO is 'on-policy enough': it reuses each rollout K times under IS correction, getting most of the sample efficiency of off-policy learning without the instability of a full replay buffer. The clip in L^{CLIP} is precisely the tool that prevents the IS ratio from exploding.",
    prereqs: ["ppo-clipped-surrogate"],
  },
  {
    id: "rlhf-vs-sft",
    topic: "rlhf-core",
    front: "Why does RLHF improve over SFT even when SFT covers the same distribution?",
    back:
      "SFT is maximum-likelihood: it treats every token in the demonstration as equally correct and provides no signal about the space of responses NOT in the dataset. A model that has SFT'd perfectly on the demonstration distribution still doesn't know which of two plausible completions is preferred when both are in-distribution. RLHF adds that exact signal: pairwise preferences define a relative ordering on the output space that SFT never sees. Concretely: (1) SFT loss gradients vanish for tokens already assigned high probability — diminishing returns once you fit the training set. RLHF's policy gradient keeps pushing preferred samples up relative to dispreferred ones indefinitely. (2) RLHF aggregates over the entire preference dataset a global ranking that no single demonstration can express. (3) The KL-to-SFT penalty ensures RLHF's updates are corrections to SFT rather than a departure from it — you keep SFT's competence and add the preference ordering on top. This is why InstructGPT's RLHF'd model beat a 100× larger un-RLHF'd one on human preference.",
    prereqs: ["bradley-terry", "kl-penalty-purpose"],
  },
  {
    id: "frozen-reference",
    topic: "rlhf-core",
    front: "Why freeze the reference model during RLHF?",
    back:
      "The KL penalty D_KL(π_θ ‖ π_ref) only has meaning if π_ref is a stable target. If π_ref were updated alongside π_θ (say, EMA'd toward π_θ), the KL would asymptote to zero no matter what π_θ did — the 'trust region' would drift along with the policy and provide no anchor to in-distribution text. A frozen π_ref (usually the SFT model) means the KL term always measures divergence from the known-good, RM-calibrated distribution. This is why every production RLHF implementation loads π_ref once, puts it in eval mode, and wraps it in torch.no_grad forever. The one nuance is memory: you need π_ref weights alongside π_θ weights during training, so shared-parameter LoRA-style adapters are attractive — the base is shared, only the LoRA delta separates π_θ from π_ref, halving the memory footprint.",
    prereqs: ["kl-penalty-purpose"],
  },
  {
    id: "rm-calibration",
    topic: "reward-model",
    front: "Reward-model calibration — define it and describe how to check it.",
    back:
      "A reward model is calibrated if, when it assigns a preference probability P(y_w ≻ y_l) = σ(r(x,y_w) - r(x,y_l)) = p, the empirical rate at which human annotators agree is also p. Well-calibrated RMs are critical because PPO uses r scores directly — a mis-calibrated RM means the policy optimises a distorted landscape. To check: take a held-out preference set, bucket the pairs by the RM's predicted p (e.g. 10 bins from 0.5 to 1.0), and plot empirical human agreement within each bucket against predicted p. A diagonal line is calibrated; a curve above the diagonal means the RM is under-confident; below means over-confident. Typical fixes: temperature scaling on the RM logits (a single scalar T learned on held-out), ensembling multiple RMs and averaging, or discarding pairs where the RM's confidence disagrees sharply with annotator agreement rate during training.",
    prereqs: ["bradley-terry"],
  },
  {
    id: "tulu3-recipe",
    topic: "rlhf-core",
    front: "The Tülu 3 recipe — what are its three training stages?",
    back:
      "Tülu 3 (Ai2, Nov 2024) formalises a fully open post-training recipe in three explicit stages. (1) SFT on a carefully curated ~900k-example mix: the Tülu 3 SFT mix blends instruction-following, math, code, safety, and persona data; the key contribution is data curation and explicit decontamination against evals, not a novel algorithm. (2) DPO on the same kind of curated preference data, with an on-policy component — they sample completions from the SFT checkpoint itself so the preference pairs are closer to the post-SFT distribution. (3) RLVR — Reinforcement Learning with Verifiable Rewards — a final PPO stage run only on prompts where a deterministic checker exists (math answers, code unit tests, instruction-following tests like 'respond in JSON'), using the checker as the reward and the DPO model as π_ref. Net: SFT builds general capability, DPO aligns to preferences, RLVR sharpens reasoning. Every dataset, recipe, and model weight is released, which is why it's the go-to reference for an open, reproducible post-training baseline.",
    prereqs: ["dpo-derivation", "grpo-advantage"],
  },
  {
    id: "rlaif",
    topic: "cai",
    front: "RLAIF vs RLHF — what does RLAIF replace, and does it work?",
    back:
      "RLAIF (RL from AI Feedback) replaces the human preference labels with labels generated by an off-the-shelf strong LLM. The policy still trains via the same RM / PPO (or DPO) pipeline; the only change is that the preference dataset is synthesised by prompting a labeller model with 'which of these two responses is better?'. Lee et al. (2023) showed that on harmlessness and summarisation, an RLAIF-trained model matches or exceeds an RLHF-trained one at human-preference evaluation, using a labeller of the same scale as the policy. The practical payoff is cost: human preference collection is the expensive step in RLHF and RLAIF removes it. Caveats: the labeller's biases transfer directly to the RM; RLAIF is only as good as the labeller's own preferences; for novel tasks where the labeller wasn't trained, humans still win. Constitutional AI's RL-CAI stage is essentially RLAIF with the labeller prompted to follow a written constitution.",
    prereqs: ["bradley-terry"],
  },
  {
    id: "christiano-2017",
    topic: "rlhf-core",
    front: "Christiano et al. 2017 — what did they demonstrate and why does it matter?",
    back:
      "'Deep Reinforcement Learning from Human Preferences' (Christiano, Leike, Brown, Martic, Legg, Amodei) was the first paper to show that you can train a deep RL agent by comparing pairs of short trajectory segments rather than by providing a hand-designed reward function. The setup: train a reward-model neural net to predict human pairwise preference between two 1-2 second clips, then RL the policy against that learned reward. Results on Atari and MuJoCo showed it learned complex behaviours (a simulated robot doing a backflip) from < 1000 preference queries — orders of magnitude less human input than would be required to demonstrate the behaviour directly. This is the load-bearing ancestor of InstructGPT and all modern RLHF: the core recipe (preference → RM → RL) is identical; InstructGPT just scaled it to language and Bradley-Terry gave it a tidy loss function. Reading it pays off because the preference-sampling strategies (uncertainty-based active queries) still appear in reward-hacking mitigations today.",
  },
  {
    id: "instruct-alignment-tax",
    topic: "rlhf-core",
    front: "What is the 'alignment tax' and how did InstructGPT's RLHF affect it?",
    back:
      "Alignment tax is the degradation of a model's general-capability benchmark scores as a cost of alignment training. Ouyang et al. (2022) explicitly measured this: RLHF'd GPT-3 1.3B, 6B, and 175B were evaluated on public NLP benchmarks (SQuAD, DROP, HellaSwag, WMT, etc.) and showed modest regressions vs the base GPT-3 — the alignment tax. Their mitigation was a PPO-ptx variant: mix the pretraining LM loss back in during PPO with a small weight, on pretraining samples drawn from the pretraining distribution. PPO-ptx recovered most of the lost benchmark performance while preserving the human-preference wins. The modern gloss of the same idea is SFT data curation + preference data with a broad distribution — Tülu 3 and Llama-3 post-training treat alignment-tax prevention as primarily a data-curation problem rather than a loss-function one.",
  },
  {
    id: "ppo-implementation-details",
    topic: "ppo",
    front: "Name four of the 'PPO implementation details that matter' for RLHF.",
    back:
      "From Costa Huang et al.'s '37 implementation details' writeup and the broader folklore: (1) advantage normalisation per minibatch — subtract mean, divide by std — to stabilise gradient scales. (2) Value-function clipping: clip the critic's update by the same ε as the policy to prevent the critic from lurching on noisy batches. (3) Gradient clipping at a norm of 1.0 (or 0.5) — PPO's clip is NOT a substitute for gradient clipping; language models still spike occasionally. (4) Value-function loss coefficient c_v ≈ 0.5 and entropy bonus c_e ≈ 0.01 — the entropy bonus prevents premature policy collapse. Others that matter a lot: reward whitening (subtract rolling mean of rewards), separate optimizers for policy and value with different learning rates, initialising the value head from the RM (not from scratch), logging the KL to π_ref per-step and early-stopping if it explodes. Miss any of these and RLHF diverges in ways that look like 'the method doesn't work'.",
    prereqs: ["ppo-clipped-surrogate", "gae"],
  },
  {
    id: "eval-harnesses",
    topic: "eval",
    front: "Why is AlpacaEval-LC preferred over raw AlpacaEval, and what is MT-Bench good for?",
    back:
      "Raw AlpacaEval asks a judge LLM to pick the preferred response between a candidate and a reference; the judge has a strong length bias, so a model can climb AlpacaEval's leaderboard just by producing longer outputs. AlpacaEval-LC (length-controlled, Dubois et al. 2024) regresses the length effect out of the judge's preference, fitting a logistic model with length as a nuisance variable and reporting the length-adjusted win rate. The result correlates much better with human Arena judgments and can't be gamed by verbosity. MT-Bench (Zheng et al. 2023) is complementary: 80 curated multi-turn questions spanning writing, reasoning, math, coding, roleplay, extraction, STEM, humanities, with a judge LLM scoring 1-10 for each turn. Its strength is category-level diagnostics — you see immediately if your model regressed on reasoning vs coding. Its weakness is small sample size and judge-bias noise. In practice: AlpacaEval-LC for a single headline 'preference win rate' number, MT-Bench for per-skill diagnostics, Arena-Hard or real Arena for ground-truth human preference.",
  },
  {
    id: "ipo-kto-simpo",
    topic: "dpo",
    front: "DPO variants — what do IPO, KTO, and SimPO change vs DPO?",
    back:
      "IPO (Azar et al. 2024, 'A General Theoretical Paradigm...'): DPO can overfit by driving the preferred-vs-dispreferred log-ratio to ±∞ on any pair where the model is already confident. IPO replaces DPO's log-sigmoid loss with a squared loss on the log-ratio minus a target margin 1/(2β); this regularises the magnitude and empirically reduces DPO's tendency to 'sharpen' on noisy preference pairs. KTO (Ethayarajh et al. 2024): drops the requirement of PAIRED preferences. Instead, each sample has a binary 'desirable / undesirable' label; the loss uses a Kahneman-Tversky prospect-theory value function on the policy vs reference log-ratio. Massively expands what data can be used — no annotator needs to rank two outputs side by side. SimPO (Meng et al. 2024): removes π_ref entirely, averages log-probs by length (length-normalised reward), and adds a fixed margin γ. One fewer model in memory at train time; competitive with DPO on Arena-Hard. Pick DPO as default; IPO when DPO overfits; KTO when you only have binary labels; SimPO when you need to save memory.",
    prereqs: ["dpo-derivation"],
  },
  {
    id: "ultra-feedback",
    topic: "reward-model",
    front: "UltraFeedback — what is it and why is it the go-to preference dataset for open RLHF?",
    back:
      "UltraFeedback (Cui et al. 2023) is a ~64k-prompt, 256k-response dataset created by: (a) prompting a mix of 17 open LLMs ranging from ~7B to GPT-4 on 64k instructions drawn from UltraChat, ShareGPT, Evol-Instruct, and FLAN, (b) having GPT-4 score each response along four axes (instruction-following, truthfulness, honesty, helpfulness) on a 1-5 scale with rationales. Preference pairs are then derived by taking the highest-rated response as y_w and a lower-rated one as y_l. It has become the default open preference dataset because it covers a broad range of instruction types, the responses come from many models (so the RM doesn't overfit to one generator's style), and GPT-4 scoring keeps annotation cost tractable. Zephyr, Tülu 2, and many DPO reproductions train on it. Caveat: it inherits GPT-4's biases wholesale — the length bias and the preference for structured / verbose answers — so RMs trained purely on UltraFeedback often need explicit length normalisation.",
    prereqs: ["length-bias"],
  },
  {
    id: "megatron-parallel",
    topic: "distributed",
    front: "Megatron's 3D parallelism — what are the three axes and when is each the bottleneck?",
    back:
      "Tensor parallelism (TP): shard individual matmuls across GPUs, typically the QKV projection and the MLP's hidden-dim matrices. Communication is all-reduce inside every transformer block; scales only within a single node because NVLink bandwidth is the limit. Pipeline parallelism (PP): assign contiguous layer groups to different nodes, pass activations forward / gradients backward in micro-batches to fill the pipeline. Communication is point-to-point activations between stage boundaries; scales across nodes but adds pipeline-bubble overhead ∝ (P-1)/m for P stages and m micro-batches. Data parallelism (DP): replicate the model, shard the batch, all-reduce gradients. Communication is one all-reduce per step; scales widely but each rank holds a full copy (use ZeRO/FSDP to shard that). Rule of thumb: TP up to 8 (within a node), PP across nodes to split models too big for TP, DP on top for throughput. 3D-parallel training at ~1T params typically uses TP=8, PP=16, DP=128 on 16384 GPUs.",
    prereqs: ["fsdp-vs-ddp"],
  },
  {
    id: "triton-why",
    topic: "gpu",
    front: "Triton vs CUDA — when does Triton win, and when do you still need CUDA?",
    back:
      "Triton (OpenAI, 2021) is a Python DSL for GPU kernels that targets a tile-based programming model: you write kernels in terms of blocks of threads and tensor tiles, and the Triton compiler handles shared-memory allocation, vectorisation, and warp-level scheduling. Wins: kernels like FlashAttention, Mamba, and custom fused matmul+activation ops are 3-5× easier to write in Triton than in CUDA C++, and they achieve >90% of peak tensor-core throughput on A100/H100. You can iterate on a new kernel in hours, not weeks. Loses: Triton currently lacks full access to Tensor Memory Accelerator features on Hopper, and a handful of bleeding-edge FP8 / MMA layouts. For those you still drop to CUDA C++ or to CUTLASS/cuDNN. The typical frontier-lab stack is: Triton for anything you need to write once and iterate on (kernel fusion, attention variants), CUDA+CUTLASS for the dense compute hotpath (GEMM), PyTorch + torch.compile everywhere else.",
  },
  {
    id: "deepseek-r1-recipe",
    topic: "reasoning-rl",
    front: "DeepSeek-R1 — sketch the multi-stage training recipe.",
    back:
      "DeepSeek-R1 (Jan 2025) has two headline models. R1-Zero: starts from DeepSeek-V3-Base and runs pure GRPO with rule-based verifiable rewards (math answer correctness + format regex) — NO SFT at all. It learned strong chain-of-thought reasoning from scratch but the CoTs are chaotic (language mixing, unreadable layouts). R1 (the shipped model) adds a multi-stage fix: (1) 'cold-start' SFT on a few thousand long-CoT examples for readable formatting; (2) GRPO round 1 with verifiable rewards + a language-consistency reward; (3) rejection-sampling SFT on R1's own high-quality reasoning traces plus curated non-reasoning data (writing, factual QA); (4) final RL stage combining rule-based rewards on reasoning prompts with helpfulness/harmlessness RMs on open prompts. Key methodological claim: the SFT step is there for readability, not capability; GRPO with verifiable rewards is what drives the reasoning gains. This is the most important RL-for-reasoning paper of 2024-25.",
    prereqs: ["grpo-advantage", "prm-vs-orm"],
  },
  {
    id: "rule-based-rewards",
    topic: "safety",
    front: "Rule-based rewards (RBR) — what problem do they solve in RLHF?",
    back:
      "Mu et al. (OpenAI, Nov 2024) introduce RBR as a way to get fine-grained behavioural control without collecting new human preference data per rule. The method: define each safety / behaviour rule as a natural-language proposition (e.g. 'the response refuses hard-harm requests without moralising'), use an LLM-as-judge to score compliance with each proposition on a continuous scale, then combine those per-proposition scores into a reward signal used alongside (or instead of) the preference RM during PPO. The wins: you can update a rule by editing a sentence rather than re-collecting thousands of labels; rule compliance is auditable per-example; the safety-helpfulness tradeoff is tuneable by reweighting propositions. Compared to Constitutional AI, RBR is more granular (many rules × continuous scores vs a bulk constitution) and integrates with an existing preference RM rather than replacing the human-feedback pipeline. Context: OpenAI used this in the o1 family's safety training.",
    prereqs: ["constitutional-ai"],
  },
];

/** Index by id for O(1) lookups. */
export const FLASHCARDS_BY_ID: Map<string, Flashcard> = new Map(
  FLASHCARDS.map((c) => [c.id, c])
);
