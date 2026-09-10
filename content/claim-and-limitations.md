# Claim & Limitations

**One-sentence falsifiable claim:**
"A fixed-size weight matrix stores binary patterns via Hebbian learning and retrieves them from corrupted inputs, but storing more than ~13.8% of neuron count causes destructive interference that corrupts retrieval."

**What would prove this false:** if the network kept retrieving all 5 stored patterns (T, O, X, L, H) cleanly from noise — no accuracy drop, no garbled output — that would falsify the "destructive interference" half of the claim, since 5 patterns is well above the ~3-pattern capacity of a 25-neuron network. Conversely, if retrieval already degraded below the ~3-pattern threshold (e.g. failing badly with only 2 patterns stored), that would falsify the "up to ~13.8%" half. Both directions are directly reproducible in the Demo tab.

## Named limitations / common misconceptions this demo surfaces

1. **"A network either knows a pattern or it doesn't."** This is the main misconception the demo corrects. Retrieval quality is continuous, not binary — match percentage degrades gradually as capacity is exceeded or noise increases. There is no clean line between "remembered" and "forgotten," only a capacity-vs-fidelity tradeoff.
2. **Spurious attractors are not "bugs."** The energy landscape this network minimizes contains stable states that were never explicitly stored — linear superpositions of real patterns. A noisy input can converge to one of these false memories even when capacity hasn't been exceeded. This is a structural property of the classical Hopfield energy function, not an implementation defect.
3. **Binary-only is a real simplification, not the whole story.** This demo uses classical ±1 Hopfield dynamics. Modern (continuous) Hopfield networks extend the same idea to continuous-valued inputs via a softmax-based energy function, which is mathematically related to self-attention — that bridge is discussed, at the SIMPLIFIED level, in the BDH tab and in `PAPERS.md`.
4. **Confusing this demo's Hebbian rule with BDH's actual mechanism.** The demo's memory matrix is a closed-form, fixed rule (W += x·xᵀ/N) you can read directly as a heatmap. BDH has *two separate pieces*: (a) trained parameters M, fixed via gradient descent before inference, and (b) a fast-weight state σ written *during inference* by a Hebbian-style plasticity rule between co-active units (arXiv:2509.26507 §2.5: "entirely relies on synaptic plasticity with Hebbian learning using spiking neurons"). The key distinction is not "Hebbian vs. gradient descent" — BDH's inference-time update is also Hebbian. The key distinction is that BDH's Hebbian rule sits on top of a separately trained backbone that shapes what gets written, whereas this demo's rule is hand-designed and the only learning signal. Both face a capacity/compression tradeoff; the mechanism producing that tradeoff differs in the ways above. See the BDH tab for the explicit LIVE/SIMPLIFIED breakdown.

## Falsifiability note for judges

The claim is intentionally scoped to the exact system implemented (25 neurons, classical Hebbian rule, ±1 patterns) so "what would make it wrong" has a concrete, demo-observable answer — not a claim about BDH's real-world performance, which this demo does not measure and does not attempt to.
