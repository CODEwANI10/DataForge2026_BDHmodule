# How this connects to BDH

**Learning objective:** after this section, you should be able to say exactly which quantity is called "memory" in BDH vs. in BDH CQ vs. in this demo, and explain why the analogy holds for part of it and breaks for the rest — not just that "they're different."

## BDH vs. BDH CQ: keeping it strict

- **BDH** (Kosowski, Uznański, Chorowski, Stamirowska, Bartoszkiewicz, "The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain," arXiv:2509.26507): a brain-inspired Post-Transformer architecture. Its working memory is not a single mechanism — it has two distinct parts (see below).
- **BDH CQ** ("BDH-CQ: In-Context Learning with Recurrent Latent Reasoning," arXiv:2608.09888): a later, separate system built on BDH ideas, adding in-context learning from demonstrations and a latent reasoning workspace, without a written chain of thought.

## What actually changes in BDH — and why it's *not* simply "gradient descent instead of Hebbian"

A common shortcut is to say "our demo uses Hebbian learning, BDH uses gradient descent — completely different mechanisms." **That's not accurate, and it's worth correcting directly:** per the primary source (arXiv:2509.26507, Section 2.5), *"the working memory of BDH during inference entirely relies on synaptic plasticity with Hebbian learning using spiking neurons."* BDH's own paper describes its working memory as Hebbian — the same general family of update rule this demo uses, not a different one.

The real, more precise distinction is that BDH has **two separate pieces**, not one:

1. **Trained parameters** — fixed after training via gradient descent over a large corpus. These are analogous to the architecture itself, not to a per-session memory.
2. **A Hebbian-updated fast-weight state** — written *during inference*, via a rule between co-active units. The paper's own notation (Section 1.2, Eq. 2): `Y(i), X(j) → σ(i,j)` — a Hebbian potentiation between pre- and post-synaptic activity. The state-space form (Section 1.4): `σ(t+1) = A(M, σ(t), a_t)`, where `M` is the fixed trained parameter set and `σ` is the evolving fast-weight state. The paper also notes (Section 1.2) that this fast-weight state is O(n²) in size — the same order of growth as this demo's N×N weight matrix.

**In our demo**, `W` (the edge-weight matrix) is the *entire* memory — there is no separate trained component; the rule that updates `W` was hand-picked by the demo's author, not learned.

**Where the analogy holds:** both systems write correlations between co-active units into a Hebbian-updated, matrix-shaped store, and both trade capacity for what can be held without interference.

**Where it breaks:**
- BDH's Hebbian fast weights sit on top of a *separately trained* backbone that shapes what the Hebbian dynamics respond to — the rule governing what gets written is itself partly learned. Our demo's rule is entirely fixed and hand-designed.
- BDH's fast-weight memory is explicitly scoped to a working-memory timescale — the paper describes potentiation "at scales of minutes for the brain (up to hundreds of tokens)" (Section 2.5) — not the indefinite, session-long storage this demo uses.
- Our demo stores hand-designed firing sequences over 4 labeled nodes; BDH's fast weights accumulate correlations over a large, distributed, learned internal representation — not a small, human-readable grid.

## BDH CQ — a distinct, later system

Per arXiv:2608.09888 (Section 3.2, Eq. 1), BDH CQ maintains a recurrent memory update `Sₜ = U_θ(Sₜ₋₁, Dₜ)` — a single, fully trained update function (linear attention is named as one special case). It also runs a separate latent reasoning workspace, iterated as `H_{r+1} = F_θ(H_r, S_K)` (Section 3.3) — this is the mechanism behind reasoning without a written chain of thought. Critically, the paper states θ is *not* updated at inference time — adaptation happens purely through the evolving state S, under one fixed, trained function. Reported result (Section 5): a 150M-parameter model reaching 29.5% pass@2 on ARC-AGI-1 — a real number from the paper, not something this demo measures or reproduces.

---

### Interactive Checkpoint: The Memory Mechanism

<div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; margin-top: 15px;">
    <strong>Objective:</strong> say which specific thing is being called 'memory' in BDH vs. in this demo, and why that's a real but limited analogy — not that they're unrelated.
    <br><br>
    <label style="font-weight:bold; cursor:pointer;">
        <input type="checkbox" id="bdh-toggle" onchange="document.getElementById('bdh-compare-view').innerHTML = this.checked ? 'BDH (SIMPLIFIED) &mdash; two parts: (1) trained parameters M, fixed via gradient descent; (2) a separately Hebbian-updated fast-weight state &sigma;, written during inference: &sigma;(t+1) = A(M, &sigma;(t), a_t) [arXiv:2509.26507, &sect;1.2 Eq.2, &sect;1.4]. Scoped to a working-memory timescale (&ldquo;minutes&hellip;up to hundreds of tokens,&rdquo; &sect;2.5).' : 'Our Demo (LIVE) &mdash; one piece: edge weights W are the entire memory, updated by a fixed, hand-picked Hebbian rule. No separately trained component, no working-memory timescale limit &mdash; W persists for the whole session.';">
        Toggle: what changes in our demo vs. BDH?
    </label>
    <div id="bdh-compare-view" style="margin-top:10px; padding: 10px; background: #e2e8f0; font-family: monospace; border-radius: 4px;">
        Our Demo (LIVE) &mdash; one piece: edge weights W are the entire memory, updated by a fixed, hand-picked Hebbian rule. No separately trained component, no working-memory timescale limit &mdash; W persists for the whole session.
    </div>
</div>

---

**Primary sources cited above:**
Kosowski, Uznański, Chorowski, Stamirowska, Bartoszkiewicz, "The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain," arXiv:2509.26507 — Sections 1.2, 1.4, 2.5.
"BDH-CQ: In-Context Learning with Recurrent Latent Reasoning," arXiv:2608.09888 — Sections 3.2, 3.3, 5.
