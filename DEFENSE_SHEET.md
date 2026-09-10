# Live-Defense Prep Sheet (Internal — not for submission)

Sourced directly from `src/App.jsx`'s actual code and `README.md`. Nothing below claims behavior the code doesn't have.

---

## 1. Component-by-component: what's live vs. simplified

Say these out loud in plain language — no need to read code to judges.

- **Weight matrix (the memory):** LIVE. `makeWeights()` creates a 25×25 zero matrix; `storePattern(W, p)` adds `x_i·x_j/N` to every off-diagonal cell on each Store click. This is real matrix arithmetic running in the browser, not a lookup table.
- **Retrieval / convergence:** LIVE. `updateState(W, s)` computes `sign(Σ_j W_ij·s_j)` for every neuron simultaneously; `converge()` repeats this until the state stops changing (or 20 steps), recording every intermediate frame for playback. The "Step X / Y" counter and the final "Converged ✓" both reflect this real loop, not a canned animation.
- **Noise corruption:** LIVE. `addNoise(p, rate)` flips each bit independently with probability `rate`, freshly computed on every Retrieve click — the corrupted pattern shown is not one of a few pre-baked examples.
- **Capacity meter:** LIVE, but the ~13.8% constant itself (`CAP = Math.floor(0.138 * N)`) is a fixed theoretical value from the literature (Hopfield, 1982; tightened by Stojnic, 2024), not something the code re-derives at runtime. What's live is tracking `stored.length` against that fixed constant.
- **Weight heatmap:** LIVE. Redrawn from the actual `weights` array after every store; the purple/blue intensity is a direct linear map of each cell's value.
- **Guided walkthrough (Feature 9):** LIVE UI logic (a 4-step state machine, `walkStep`/`walkOpen`), but the walkthrough's *text* is static, authored content — it does not read the live state to describe what's happening, it describes what the learner is about to do. The highlight ring it draws is real (conditional box-shadow applied to whichever actual card matches `WALKTHROUGH_STEPS[walkStep].target`), not a screenshot overlay.
- **Comprehension check (Feature 10):** the multiple-choice answers are checked against a hardcoded `correct` flag on each option (static authored content, correctly not claimed as "graded" anywhere) — but the *unlock condition* (`quizUnlocked`) is live, tracking a real `Set` of which actions (`store`, `retrieve`) the learner has actually performed.
- **"BDH Connection" tab prose & equations:** static written content, correctly not labeled LIVE. The interactive toggle (`bdhToggle` state) that switches between "our demo / BDH / BDH CQ" is real, live UI state — but the three panels of explanatory text it reveals are authored, not generated or computed.
- **"vs. Attention" tab:** LIVE on both sides. `handleCompare()` generates a fresh noisy query, runs the same `converge()` used in the Demo tab for the classical output, and runs `attentionRetrieve()` — a real softmax over real dot-product similarities between the query and the actual stored pattern vectors — for the attention output. The β slider is a real variable read directly into that computation.
- **"Predict what will happen" (Feature 4):** LIVE unlock/comparison logic (`prediction`, `lastPredictionResult` state), but the three prediction buckets ("clean" ≥85%, "partial" 40–84%, "fail" <40%) are fixed, authored thresholds applied to the real match percentage — not something the model itself outputs.
- **"Truth beside estimate" capacity warning:** triggers on the real `stored.length > CAP` condition, but the "expected" side is a qualitative statement ("degraded/garbled retrieval"), not a fabricated precise number — classical Hopfield capacity theory describes population-level behavior, not a single-trial prediction, so a fake specific percentage would be a bigger overclaim than a qualitative label.

---

## 2. Likely judge questions

1. **"What happens if you store all 5 patterns and retrieve one?"**
   `stored.length` (5) exceeds `CAP` (⌊0.138×25⌋ = 3). The capacity meter turns red. Retrieval still runs the same live convergence loop, but the resulting fixed point is typically a mixture/garbled version of multiple stored patterns — a real consequence of `storePattern` summing all five patterns' contributions into the same 25×25 matrix, not a scripted failure state.

2. **"Is the retrieval animation real or precomputed?"**
   Real. `converge()` runs entirely in-browser at click time and returns every intermediate frame; the UI just plays them back on a `setInterval` for legibility (250ms/step). Nothing about the sequence of states is precomputed or looked up.

3. **"Why 0.138 specifically?"**
   It's Hopfield's own asymptotic result (`α꜀ ≈ 0.14`) for a Hebbian-rule network tolerating a small retrieval-error rate, refined with tighter bounds by Stojnic (2024, arXiv:2403.01907). It is a property of the *classical, dense* Hebbian rule specifically — not a property of "Hopfield networks" as a category (see the BDH tab / Limits tab for how modern, continuous Hopfield variants change this).

4. **"Does the BDH tab run any real BDH model?"**
   No, and the tab doesn't claim to. It's static text and equations, cited to specific sections of the primary sources (arXiv:2509.26507 §1.2/§1.4/§2.5 for BDH; arXiv:2608.09888 §3.2/§3.3/§5 for BDH CQ), contrasting our fixed Hebbian rule against BDH's Hebbian fast-weight state and BDH CQ's recurrent state update. No BDH or BDH CQ weights, code, or inference is executed anywhere in this project — including in the interactive toggle, which switches between three static text panels, not three running models.

5. **"How does the guided walkthrough know what to highlight?"**
   Each step in `WALKTHROUGH_STEPS` names a `target` ('store' | 'retrieve' | 'output'). The JSX for each of those three real cards checks `WALKTHROUGH_STEPS[walkStep].target` and conditionally applies a highlight box-shadow — so the highlighted element is always one of the three real, functional cards, never a mockup image.

6. **"What happens if a learner picks the wrong quiz answer?"**
   `quizAnswers[qi]` stores whichever option they clicked; the explanation panel checks that option's `correct` flag and shows either "Correct." or "Not quite." followed by the same explanation text either way — so a wrong answer isn't a dead end, it's shown the reasoning regardless of which option was picked.

7. **"Why Hebbian instead of a trained/gradient-based rule, like BDH uses?"**
   Two reasons: (1) it's the exact system the cited capacity papers (Stojnic, 2024; and Hopfield's original result) analyze, so the demo's 0.138 constant is literally the number those papers derive, not an approximation; and (2) a closed-form rule can be read directly off a heatmap, which is the whole point of the interpretability contrast drawn in the BDH tab — a trained update function can't be inspected the same way, and even BDH's own Hebbian fast-weight component sits on top of a separately-trained backbone that shapes what it responds to.

8. **"What's the difference between BDH and BDH CQ, and does this demo model both?"**
   Per the BDH tab's interactive toggle: BDH has two parts — trained parameters (fixed after training) plus a separate Hebbian-updated fast-weight state, scoped to a working-memory timescale (paper's own words: "minutes... up to hundreds of tokens"). BDH CQ is a distinct, later system with one trained recurrent update `Sₜ = U_θ(Sₜ₋₁, Dₜ)` and no parameter updates at inference. This demo models neither directly — it models the base associative-memory idea (fixed-capacity, interpretable-vs-not) and states the BDH/BDH CQ comparison as an analogy, not a simulation.

9. **"Is the 'vs. Attention' tab actually running attention math, or is it another simplified box?"**
   It's real. `attentionRetrieve()` computes `β · (query · pᵢ)` for every stored pattern, softmaxes those scores, and returns the weighted average of the patterns — the literal similarity→softmax→weighted-sum operation used in Transformer self-attention, just applied to pattern retrieval instead of tokens. The weight bars shown are the actual softmax output, not illustrative placeholders. What it does *not* do is implement the full continuous-Hopfield energy function or its convergence proof (Ramsauer et al., 2021) — it's a one-step illustration of the shared mechanism, and the tab says so explicitly.

10. **"If I raise β on the vs. Attention tab, what should happen, and why?"**
   Higher β sharpens the softmax, pushing weight toward whichever stored pattern is most similar to the query — approaching a one-hot ("winner take all") selection as β grows. Lower β spreads weight more evenly across all stored patterns, producing a blurrier weighted-average output. This is a direct, predictable consequence of softmax temperature scaling, not a tuned/cherry-picked behavior.

---

## 3. What would prove the one-sentence claim wrong

If storing more than ~3 patterns (out of the network's 25 neurons) continued to retrieve every pattern cleanly with no accuracy loss, that would falsify the "destructive interference" half of the claim. If retrieval already failed badly with only 1–2 patterns stored — well under the ~13.8% capacity line — that would falsify the "~13.8%" half. Both are directly testable in the Demo tab by changing how many patterns are stored before retrieving.
