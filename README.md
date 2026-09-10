# Hopfield Associative Memory — Interactive Explainer
**DataForge 2026 | Pathway Track | Topic: Memory & State**

**Team:** Aniket Anand Khot, Devansh Dheeraj Agrawal, Deep Vaibhav Lokhande, Yash Manoj Dhatrak
**College:** Pune Vidyarthi Griha's College of Engineering, Technology and Management, Pune

---

## 1. The claim

> A fixed-size weight matrix stores binary patterns via Hebbian learning and retrieves them from corrupted inputs, but storing more than ~13.8% of neuron count causes destructive interference that corrupts retrieval.

This is falsifiable and directly reproducible: store all 5 preset patterns (well above this network's ~3-pattern capacity) and retrieve one — if it still came back perfectly clean every time, the claim would be false. Store only 2 and retrieve with moderate noise — if that failed badly too, the claim would also be false (capacity would be lower than stated). Both are one click away in the Demo tab.

---

## 2. Intended learner & prerequisites

**Audience:** ML practitioners or advanced students who understand basic neural networks and matrix multiplication, but have not studied classical associative memory or Post-Transformer architectures.

**Prerequisites:**
- Matrix multiplication
- Basic understanding of neural networks
- Concept of gradient descent (for the BDH comparison section only)

---

## 3. Learning objectives

After using this artifact, the learner should be able to:

1. Explain the Hebbian learning rule and why it encodes patterns as connection strengths, not separate records.
2. State the ~0.138×N capacity limit and predict, before clicking, whether a given number of stored patterns is within or beyond it.
3. Reproduce the interference failure mode by storing 4+ patterns and retrieving one.
4. Connect Hopfield networks to BDH: name the two separate things BDH calls "memory" (a trained parameter set, and a separately Hebbian-updated fast-weight state) and explain why only the second is a fair comparison to this demo's weight matrix — and why even that comparison breaks once you account for BDH's fast weights sitting on top of a learned backbone.
5. Explain, using the "vs. Attention" tab, why one-shot softmax attention and iterative Hopfield convergence are two ways of solving a related problem — and why the ~13.8% capacity ceiling shown in the Demo tab does not transfer to the attention-style computation.
6. Identify at least two failure modes (capacity overflow, spurious attractors) and the one deliberate simplification (binary-only patterns) this demo makes.

---

## 4. Architecture of the artifact

Single-page React application (Vite build). No backend, no API calls, no external ML libraries — all Hopfield math is plain JavaScript in `src/App.jsx`.

```
hopfield-explainer/
├── index.html                          Vite entry point
├── package.json / vite.config.js
├── src/
│   ├── main.jsx                        React root
│   ├── App.jsx                         All logic, UI, sub-components
│   └── index.css                       Reset + accessibility/responsive CSS
├── content/
│   └── claim-and-limitations.md        Falsifiability + named limitations
├── dev-notes/                          Internal working docs (not a submission requirement)
│   ├── DEPLOYMENT.md
│   └── AUDIT.md
├── README.md
├── PAPERS.md
├── BLOG.md / BLOG.pdf
├── AI_DISCLOSURE.md
├── DEFENSE_SHEET.md                    Internal — not for submission
├── LICENSE
└── .env.example
```

### Core math (`src/App.jsx`)

| Function | Description |
|---|---|
| `makeWeights()` | Create empty N×N weight matrix |
| `storePattern(W, p)` | Hebbian rule: `W_ij += x_i·x_j / N` |
| `updateState(W, s)` | Synchronous update: `s_i = sign(Σ_j W_ij·s_j)` |
| `converge(W, s0)` | Run to a stable state, returning every intermediate frame |
| `addNoise(p, rate)` | Randomly flip bits with probability `rate` |
| `matchPct(a, b)` | Percentage of matching bits |
| `attentionRetrieve(storedVecs, query, beta)` | One-shot softmax-attention-style retrieval: scores each stored pattern against the query, softmaxes (temperature = `beta`), returns the weighted-average pattern and the weights |

### The six tabs

- **Explore Demo** — Store panel (5 preset 5×5 patterns, capacity meter), Retrieve panel (noise slider, "predict what will happen" prompt before the first retrieve, convergence playback with per-pattern match accuracy, truth-beside-estimate when over capacity), and a live weight-matrix heatmap. Opens with T and O already pre-trained and O already retrieved from 25% noise, so the learner sees the concept working before touching anything.
- **BDH Connection** — written comparison, cited to specific sections of the BDH and BDH CQ primary sources, of this demo's fixed Hebbian rule against BDH's two-part memory (a trained parameter set plus a separately Hebbian-updated fast-weight state) and against BDH CQ's single recurrent state update. Includes a live interactive toggle (`bdhToggle` state) that switches a diagram between "our demo," "BDH," and "BDH CQ," each showing what actually changes, who set the update rule, its timescale, and whether it's human-readable.
- **vs. Attention** — a real, live comparison: given the same stored patterns and the same noisy query, computes both the classical iterative Hopfield retrieval and a one-shot softmax-attention-style retrieval (the same similarity → softmax → weighted-sum operation used in Transformer attention), with a real β (softmax sharpness) slider and the actual per-pattern attention weights shown as bars.
- **Failure Cases** — four cards (capacity overflow, spurious attractors, binary-only limitation, what BDH does differently), each with a **real-world loose-intuition callout** (clearly labeled, not a technical equivalence claim) and an **energy-landscape SVG** on the spurious-attractor card.
- **Real-Life Analogies** — four extended analogies each naming exactly where it breaks: (1) face recognition for Hopfield retrieval, (2) an overloaded pinboard for the capacity limit, (3) general education + class notes for BDH's two-part memory, (4) the Mandela Effect for spurious attractors. Each includes an SVG diagram and a "where the analogy breaks" callout.
- **BDH Synapse Demo** — a self-contained simulation of Hebbian synaptic learning at the level of individual node firings. Four modes: **Train** (click nodes; co-firing strengthens the synapse; weights decay 5%/s at idle), **Test Recall** (predict then verify whether a trained edge auto-chains), **Interference** (train a conflicting sequence and watch the old synapses fade — the direct, reproducible form of this tab's claim), and **Compare to Transformer** (drive both synapse weights and a simplified key-value cache from the same click). Includes a guided walkthrough, chain-reaction prediction game, comprehension check (unlocks after two modes), and a BDH-connection sub-tab with primary-source citations. The tab's claim — synaptic memory decays with disuse and can be overwritten — is falsifiable and reproducible in-browser.

### Guided walkthrough & comprehension check (added in this integration pass)

- A dismissible 4-step guided walkthrough opens automatically on first load of the Demo tab, highlighting the real Store, Retrieve, and Output panels in sequence (via a live CSS highlight tied to the actual card being described, not a screenshot) before handing full control to the learner.
- A "Check your understanding" button unlocks once the learner has actually performed both a Store and a Retrieve action, opening a short 2-question check (multiple choice, answer-keyed with an explanation shown either way) plus an optional, ungraded "explain it in your own words" textarea. It names the common misconception directly inside the artifact, not only here in the README.

### Accessibility & responsiveness (added in this integration pass)

- Visible keyboard focus outlines on every button, slider, and tab (`:focus-visible` in `src/index.css`), using the app's existing accent color rather than removing the default outline with nothing in its place.
- `role`/`aria-*` attributes on the tab strip (`role="tablist"`/`"tab"`/`"tabpanel"`), pattern-selector buttons (`aria-pressed`), the noise slider (`aria-label`, `aria-valuetext`), and the comprehension-check dialog (`role="dialog"`, `role="radiogroup"`).
- The two-column Store/Retrieve layout stacks to a single column below 820px (`.demo-two-col` in `src/index.css`) instead of compressing to unreadable width; the weight heatmap scrolls horizontally rather than shrinking illegibly.

---

## 5. What's LIVE vs. SIMPLIFIED

This list is checked against the actual code and against `DEFENSE_SHEET.md` — see `dev-notes/AUDIT.md` for the cross-check.

| Component | Status | What that means |
|---|---|---|
| Pattern storage (Hebbian update) | **LIVE** | Runs in-browser on each Store click; real matrix arithmetic. |
| Noise corruption | **LIVE** | Random bit-flips computed fresh on each Retrieve click. |
| Convergence / retrieval animation | **LIVE** | Synchronous updates computed in-browser; frames are real, not scripted. |
| Weight matrix heatmap | **LIVE** | Redrawn from the actual weight array after each Store. |
| Capacity meter | **LIVE tracking of a fixed constant** | `stored.length` is live; the ~13.8% (0.138) ceiling itself is a fixed theoretical value from the literature, not re-derived at runtime. |
| Guided walkthrough highlight | **LIVE UI, static text** | The highlight targets a real card via live state; the explanatory copy is authored, not generated. |
| Comprehension check unlock condition | **LIVE** | Tracks real Store/Retrieve actions performed, not a timer or a guess. |
| Comprehension check answer-correctness | **Static, authored** | Checked against a hardcoded key, not graded against live model behavior. |
| BDH tab equations & comparisons | **SIMPLIFIED / static** | Written content, cited to specific paper sections, contrasting mechanisms; no BDH or BDH CQ model is executed anywhere in this project. |
| BDH tab interactive toggle | **LIVE UI, static content per branch** | The toggle itself is real React state; the three panels of text it reveals are authored, not generated. |
| "vs. Attention" tab — classical output | **LIVE** | Same `converge()` call used in the Demo tab, run on a freshly generated noisy query. |
| "vs. Attention" tab — attention output & weights | **LIVE** | `attentionRetrieve()` computes a real softmax over real dot-product similarities between the query and the actual stored patterns — not a lookup or precomputed table. |
| "Predict what will happen" prompt | **LIVE UI, static bucket labels** | The unlock/compare logic is real; "clean / partial / fail" are fixed authored thresholds (≥85% / 40–84% / <40%) applied to the real match percentage. |
| "Truth beside estimate" capacity warning | **LIVE trigger, qualitative estimate** | Triggers on the real `stored.length > CAP` condition; the "expected" side is a qualitative theoretical expectation (Hopfield capacity theory doesn't give a precise single-trial number), explicitly labeled as such rather than presented as a fake precise prediction. |

---

## 6. Named limitation / common misconception

**Misconception this demo surfaces:** it's easy to assume a network either "knows" a pattern or it doesn't, like a saved file. This demo shows that's false: retrieval quality is continuous and degrades as shared weight capacity is exceeded — there is no clean line between "remembered" and "forgotten," only a capacity-vs-fidelity tradeoff. This misconception is named explicitly inside the comprehension check in the app itself, not only here.

**Named limitation:** this demo implements the *classical, binary* Hopfield model specifically because its Hebbian rule is a closed-form, human-readable formula — that's what makes the weight heatmap and the BDH-interpretability contrast possible. Modern (continuous) Hopfield networks relax the binary-pattern restriction and achieve much higher capacity via a different energy function; see `content/claim-and-limitations.md` and the Failure Cases tab for where this demo's specific claim does and doesn't generalize.

---

## 7. How to reproduce results

**Requirements:** Node.js ≥ 18, npm ≥ 9.

```bash
cd hopfield-explainer
npm install
npm run dev       # http://localhost:5173
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

No API keys, no environment variables, no backend — everything runs client-side.

**Capacity failure (the main claim):** Demo tab → Store all 5 patterns (T, O, X, L, H) → Retrieve any one → expect a result that doesn't cleanly match any stored pattern.
**Clean retrieval (within capacity):** Reset → store only T and O → select O, set noise to 30%, Retrieve → expect ≥85% match.
**Spurious attractors:** Store T and O → set noise to 45% → retrieve O repeatedly → occasionally the output won't cleanly match either stored pattern.

---

## 8. Public artifact URL and repository

- Public artifact URL: `[ ]` — placeholder; see `dev-notes/DEPLOYMENT.md` for exact deploy steps (Vercel/Netlify/GitHub Pages).
- Public source repository: `[ ]` — placeholder; fill in once the repo is created per `dev-notes/DEPLOYMENT.md`.

---

## 9. Credits and licenses

See `AI_DISCLOSURE.md` for the full AI-assistance disclosure and source/license record. Summary: all application code is original work (MIT License, see `LICENSE`); React and Vite are used under their own MIT licenses; no third-party fonts, images, or data files are used — see `AI_DISCLOSURE.md` §2 for the complete table.

---

## References

Full citations with claim-specific pairings are in `PAPERS.md`. In brief:
1. Stojnic (2024), *Capacity of the Hebbian-Hopfield network associative memory*, arXiv:2403.01907 — source for the 0.138 capacity constant.
2. Millidge, Salvatori, Song, Lukasiewicz, Bogacz (2022), *Universal Hopfield Networks*, ICML 2022, arXiv:2202.04557 — the classical-to-modern-Hopfield-to-attention bridge.
3. Hu, Yang, Wu, Xu, Chen, Liu (2023), *On Sparse Modern Hopfield Model*, NeurIPS 2023, arXiv:2309.12673 — evidence the ~13.8% ceiling is specific to the classical/dense variant.
4. Ramsauer et al. (2021), *Hopfield Networks is All You Need*, ICLR 2021, arXiv:2008.02217 — background only (pre-2022, not one of the three required primary papers above).
5. Dragon Hatchling (BDH) and BDH CQ — Pathway AI primary technical reports (verify all BDH claims against these directly before submission).

Also cited in `BLOG.md` (separate blog topic, distinct from this artifact's main concept): Jelassi et al. (2024), arXiv:2402.01032; Gu & Dao (2023), arXiv:2312.00752.

---

## Pre-submission checklist

- [ ] Fill in §8's placeholder URLs once deployed (`dev-notes/DEPLOYMENT.md`).
- [ ] Complete every `[ ]` in `AI_DISCLOSURE.md`.
- [ ] Replace the `LICENSE` copyright-holder placeholder.
- [ ] Review `dev-notes/AUDIT.md`'s two "worth fixing but not blocking" items.
