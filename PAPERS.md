# Primary Papers & Citations

This demo's claim — *"a fixed-size weight matrix stores binary patterns via Hebbian learning and retrieves them from corrupted inputs, but storing more than ~13.8% of neuron count causes destructive interference that corrupts retrieval"* — draws on the following verified, 2022–2026 papers. Each was checked against its own abstract/full text before inclusion; none is cited from memory alone.

---

### 1. Stojnic — "Capacity of the Hebbian-Hopfield network associative memory"
arXiv:2403.01907 (submitted 4 Mar 2024)

**Finding:** Revisits Hopfield's original 1982 claim that a Hebbian-rule network storing random binary patterns has a critical capacity ratio α꜀ = lim(m/n) ≈ 0.14, where m is the number of stored patterns and n is the number of neurons, once a small retrieval-error rate is tolerated. Using fully-lifted random duality theory, the paper derives explicit, tighter capacity characterizations for two well-known basin-of-attraction definitions (AGS and NLT) around that same ≈0.14 constant.

**What it supports in our demo:** This is the direct, load-bearing source for the exact number used in the code (`CAP = Math.floor(0.138 * N)` in `src/App.jsx`) and for the claim's central number, "~13.8% of neuron count." The demo is a literal, small-scale (N=25) instance of the exact system this paper analyzes — a Hebbian-rule Hopfield network storing random-ish binary patterns, with capacity as a fraction of neuron count. Store all 5 patterns (well above ⌊0.138×25⌋=3) in the Demo tab to see the interference this paper predicts.

---

### 2. Millidge, Salvatori, Song, Lukasiewicz, Bogacz — "Universal Hopfield Networks: A General Framework for Single-Shot Associative Memory Models"
ICML 2022, arXiv:2202.04557 (submitted 9 Feb 2022)

**Finding:** Proposes a general three-operation framework (similarity → separation → projection) that expresses classical Hopfield networks, sparse distributed memories, and modern continuous Hopfield networks (which have close mathematical links to self-attention) as different parameter choices within one unified energy-based dynamics.

**What it supports in our demo:** This is the bridge we use, at the SIMPLIFIED level, for the BDH tab's and the Limits tab's claim that classical Hopfield networks (what this demo implements), modern continuous Hopfield networks, and Transformer self-attention are related points on a single spectrum, not three unconnected ideas. It backs the Limits tab's statement that "modern Hopfield networks... mathematically [are] equivalent to self-attention in Transformers" and the bridge line "Hopfield → Attention → Post-Transformer → BDH" — this paper is the actual source for treating that bridge as a real mathematical relationship rather than a loose metaphor.

---

### 3. Hu, Yang, Wu, Xu, Chen, Liu — "On Sparse Modern Hopfield Model"
NeurIPS 2023, arXiv:2309.12673 (submitted 22 Sep 2023)

**Finding:** Introduces a sparse extension of the modern (continuous) Hopfield model, derives a closed-form sparse Hopfield energy function, and shows its one-step retrieval dynamics is equivalent to a sparse-attention mechanism. The paper proves a sparsity-dependent memory-retrieval error bound that is provably tighter than the dense model's bound, while preserving rapid convergence and exponential storage capacity.

**What it supports in our demo:** This paper is evidence that the classical-Hopfield capacity ceiling this demo demonstrates (linear in N, ≈0.14×N) is specifically a property of the *classical, dense* Hebbian model — modern Hopfield variants (dense or sparse) achieve exponential capacity in pattern dimension by using a different (softmax-family) energy function. It supports the Limits tab's "Limitation — Binary Patterns Only" card: the ~13.8% ceiling this demo shows is real for the exact system implemented here, but is not a property of "Hopfield networks" as a whole category — it is specifically a limitation of the classical Hebbian/binary variant this demo intentionally implements for interpretability.

---

### Note on scope

Ramsauer et al., "Hopfield Networks is All You Need" (ICLR 2021, arXiv:2008.02217), is referenced in the app's BDH tab and in `README.md` as foundational background for the classical-to-modern Hopfield bridge, but it predates the 2022–2026 window and is not counted among the three required primary papers above.
