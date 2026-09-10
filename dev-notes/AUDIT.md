# Cross-File Consistency & Overclaim Audit

Files reviewed: `src/App.jsx` (the actual shipped artifact), `README.md`, `PAPERS.md`, `content/claim-and-limitations.md`, `BLOG.md`, `AI_DISCLOSURE.md`, `DEFENSE_SHEET.md`.

This is a findings-and-fixes list. Where a fix was small and unambiguous, it was applied directly (noted below); everything else is left as an open item for the team.

---

## 1. One-sentence claim wording

**Finding — found and fixed.** The on-screen header in `src/App.jsx` originally read "...but exceeding ~{CAP} patterns causes destructive interference" — a paraphrase that dropped the "~13.8% of neuron count" framing and the "corrupts retrieval" ending used everywhere else (top-of-file comment, `README.md`, `content/claim-and-limitations.md`, `PAPERS.md`). **Fixed:** the header now reads the full canonical claim with the concrete numbers substituted in parentheses, so a learner sees the same sentence stated in the README and the citations.

Confirmed now identical (modulo the `{N}`/`{CAP}` template substitution, which is intentional — the claim is written to hold for any N, and the header shows the concrete N=25 case): top-of-file comment, on-screen header, `README.md` §1, `content/claim-and-limitations.md`, `PAPERS.md` intro.

## 2. LIVE vs. SIMPLIFIED contradictions

Checked `README.md`'s LIVE/SIMPLIFIED table, `DEFENSE_SHEET.md`'s component list, and what `src/App.jsx` actually computes. No contradictions found — both documents agree that pattern storage, retrieval/convergence, noise corruption, and the weight heatmap are LIVE, and that the BDH tab's equations/comparisons are static/SIMPLIFIED. The guided walkthrough and comprehension check are correctly described as "live UI logic wrapped around static authored text," not claimed as fully live content generation.

## 3. BDH vs. BDH CQ conflation check

No conflation found. The BDH tab keeps the two separate: BDH's recurrent state is described as the base mechanism being compared (`h_t = f_θ(h_{t-1}, x_t)`); BDH CQ is named separately and scoped narrowly to "in-context adaptation from demonstrations at inference time without gradient steps." `DEFENSE_SHEET.md` Q8 makes the same distinction and explicitly states the demo does not model BDH CQ's mechanism. `BLOG.md` mentions BDH once, in general terms, without invoking BDH CQ at all — no conflation risk there.

## 4. Citation placement & arXiv ID verification

| Paper | ID matches source checked live? | Claimed finding matches abstract? |
|---|---|---|
| Stojnic, Capacity of Hebbian-Hopfield network | Yes — arXiv:2403.01907 | Yes — α꜀≈0.14 result confirmed against the paper's own abstract |
| Millidge et al., Universal Hopfield Networks | Yes — arXiv:2202.04557 (ICML 2022) | Yes — similarity/separation/projection framework, MCHN-attention link confirmed |
| Hu et al., On Sparse Modern Hopfield Model | Yes — arXiv:2309.12673 (NeurIPS 2023) | Yes — sparse energy function, tighter error bound, exponential capacity confirmed |
| Jelassi et al., Repeat After Me (used in `BLOG.md`) | Yes — arXiv:2402.01032 (ICML 2024) | Yes — GSSM copying-capacity proof and the cited experimental numbers (100x sample efficiency, 410M vs. 2.8B) were checked against the paper's own text, not just the abstract |
| Gu & Dao, Mamba (used in `BLOG.md`) | Yes — arXiv:2312.00752 | Yes — selective state space / input-dependent gating description matches |

No floating citations found — each `PAPERS.md` entry states which specific in-app or in-file claim it backs, per the requirement that a citation sit beside the claim it supports rather than in a general reading list.

## 5. Overclaim check

No claims found stating something as measured/proven when it's actually a design analogy. `content/claim-and-limitations.md` explicitly separates "what this demo shows" (the classical-Hebbian capacity limit) from "what BDH does" (a stated, hedged analogy, not a measurement). `BLOG.md`'s BDH paragraph is deliberately hedged: "we make no claim about BDH's own benchmark numbers here, since verifying those is outside this post's scope" — this is the correct way to include a mandatory BDH mention without overclaiming.

One soft flag: the Limits tab's line "Modern Hopfield networks (Ramsauer et al., 2021) extend to continuous inputs via a softmax energy function — mathematically equivalent to self-attention in Transformers" states an equivalence fairly strongly. This is a defensible paraphrase of a claim made in the Hopfield-networks-is-all-you-need literature and repeated in Millidge et al. (2022), but "mathematically equivalent" is stronger language than "closely related to" — worth softening slightly, or being ready to cite the specific equivalence result if a judge pushes on it.

## 6. Package-completeness spot-check

- `content/bdh-module.md` as a standalone file does **not** exist — the equivalent "substantial BDH section" content lives inline in the app's BDH tab instead. This is flagged (not silently resolved) in `dev-notes/DEPLOYMENT.md` §5 as an open question: confirm this satisfies the rubric's BDH-integration requirement, or extract the tab's content into a standalone file as well.
- `README.md` §8 (public URL / repo) and `dev-notes/DEPLOYMENT.md` §6 both still have placeholder URLs — deployment has not happened. This blocks the "public artifact URL" and "public repository" submission requirements until someone with hosting access runs the steps in `dev-notes/DEPLOYMENT.md`.
- `AI_DISCLOSURE.md` tables are correctly structured but contain unfilled `[ ]` placeholders that must be completed with the team's real answers before submission — this is intentional (a template), not an oversight, but it is not submission-ready as-is.

---

## Summary — fixes needed before submission

**Already fixed in this pass:**
1. On-screen claim wording in `src/App.jsx` now matches the canonical claim used everywhere else.

**Blocking (must fix before submission):**
2. Deploy the built app (see `dev-notes/DEPLOYMENT.md`) and fill in the public artifact URL and repository URL in `README.md` §8.
3. Fill in every `[ ]` placeholder in `AI_DISCLOSURE.md` with the team's real answers.
4. Replace the LICENSE copyright-holder placeholder with the team's real name/org.

**Worth fixing but not blocking:**
5. Consider softening "mathematically equivalent to self-attention" in the Limits tab to "closely related to," or be ready to cite the specific equivalence proof if asked.
6. Decide whether the BDH tab's content needs to also exist as a standalone `content/bdh-module.md` file, or whether inline-in-app is sufficient for the judging rubric.
