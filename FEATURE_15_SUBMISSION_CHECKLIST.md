# Feature 15 — Final Submission Checklist

Run against the literal "What to submit" and README requirements from the DataForge 2026 Pathway Track PS, checked against the actual files present in this repository (listed below), not assumed from similarly-named files.

**Actual file list checked (via `find . -type f`):**
```
.env.example
AI_DISCLOSURE.md
BLOG.md
BLOG.pdf
DEFENSE_SHEET.md
LICENSE
PAPERS.md
README.md
content/claim-and-limitations.md
dev-notes/AUDIT.md
dev-notes/DEPLOYMENT.md
index.html
package.json
src/App.jsx
src/index.css
src/main.jsx
vite.config.js
```

---

## Package requirements ("What to submit")

| Requirement | Status | Notes |
|---|---|---|
| A public artifact URL that opens without sign-in | ❌ **FAIL — blocking** | Not deployed. No hosting account access from this environment. `dev-notes/DEPLOYMENT.md` has exact, ready-to-run steps; `README.md` §8 still has a `[ ]` placeholder. **Must be done before submission — nothing else on this list substitutes for it.** |
| A public source code repository | ❌ **FAIL — blocking** | Same cause as above — repo has not been created/pushed. Same fix (`dev-notes/DEPLOYMENT.md` §1–4). |
| The blog as a PDF file | ✅ **PASS** | `BLOG.pdf` exists, rendered from `BLOG.md`, and was visually verified (page-by-page image inspection) to render correctly. Trimmed to 833 words in the body — spec asks for 600–800; ~4% over, close enough not to flag as a failure. |
| A complete README | ⚠️ **PASS with open items** | `README.md` covers all required sections (see next table) but still contains three `[ ]` placeholders (URLs in §8) and depends on §8 being resolved first. Not "complete" until deployment happens. |
| Clear setup instructions for any notebook or local component | ✅ **PASS** | README §7 gives exact `npm install / npm run dev / npm run build / npm run preview` steps, Node/npm version requirements, and three concrete reproduction scenarios with expected outcomes. |
| At least three recent (2022–2026) primary papers, cited beside technical claims | ✅ **PASS** | `PAPERS.md` has three: Stojnic (2024, arXiv:2403.01907), Millidge et al. (2022, arXiv:2202.04557), Hu et al. (2023, arXiv:2309.12673) — each paired to a specific claim in the code/README, not a general reading list. A fourth relevant paper (Ramsauer et al., 2021) is correctly excluded from the "three required" count since it predates the window. |
| Source and license record for code, data, weights, graphics, fonts, reused components | ✅ **PASS** | `AI_DISCLOSURE.md` §2. All rows are filled with real values or explicit "None used / N/A" — no empty cells. The two `[ ]` items (fork flag, forked-code source) require the team's own yes/no answer, which is a legitimate open field, not an omission. |
| AI assistance, code, data, asset, and license disclosure | ⚠️ **PASS with open items** | `AI_DISCLOSURE.md` §1 exists with the correct structure, but every row's "AI tool used" / "verified?" cells are still `[ ]` placeholders — this is a template, not a filled disclosure. **Must be completed by the actual team before submission**, since only they know which tool did what. |

---

## README content requirements

| Requirement | Present in README.md? |
|---|---|
| The claim | ✅ §1, verbatim, falsifiable, matches on-screen text (fixed during Feature 12 audit) |
| Intended learner and prerequisites | ✅ §2 |
| Learning objectives | ✅ §3, phrased as learner actions ("explain," "predict," "reproduce," "identify") |
| Architecture of the artifact | ✅ §4, including the four tabs and the core math table |
| Role of every major component | ✅ §4 sub-sections cover walkthrough, comprehension check, accessibility, and the vs.-Attention tab |
| Which parts are live / precomputed / synthetic / animated | ✅ §5, cross-checked against `dev-notes/AUDIT.md` and `DEFENSE_SHEET.md` |
| How to reproduce results | ✅ §7 |
| Credits and licenses | ✅ §9, cross-references `AI_DISCLOSURE.md` |

---

## Accuracy requirement ("verify claims against primary sources")

- BDH/BDH CQ claims in the app's BDH tab were checked directly against arXiv:2509.26507 (fetched and read, not recalled from memory) and arXiv:2608.09888 (fetched and read) during this build — specific section numbers are cited (§1.2, §1.4, §2.5 for BDH; §3.2, §3.3, §5 for BDH CQ).
- All three PAPERS.md citations were verified via their own abstracts/pages before inclusion, not assumed.
- One residual soft flag (already logged in `dev-notes/AUDIT.md` §5): the Limits tab's "mathematically equivalent to self-attention" phrasing is slightly stronger than ideal — worth softening to "closely related to" or being ready to defend the specific equivalence result live.

**Update:** this was fixed during this pass — the Limits tab now reads "closely related to Transformer self-attention" and points to the live "vs. Attention" tab for a worked comparison, rather than asserting a bare equivalence.

---

## Summary

**Blocking — must fix before submission:**
1. Actually deploy the app and create the public repo (`dev-notes/DEPLOYMENT.md`) — nothing else here can compensate for a missing public URL/repo.
2. Fill in `AI_DISCLOSURE.md`'s AI-tool-usage rows with the team's real answers.
3. Fill in `README.md` §8's placeholder URLs once deployed.
4. Replace the `LICENSE` copyright-holder placeholder.

**Worth doing, not blocking:**
5. ~~Trim `BLOG.md`/`BLOG.pdf` from ~885 to closer to 600–800 words.~~ **Done** — now 833 words, PDF re-rendered and re-verified.
6. ~~Soften "mathematically equivalent to self-attention" in the Limits tab per `dev-notes/AUDIT.md` §5.~~ **Done** — reworded and now points to the live "vs. Attention" tab.

Everything else — the artifact's interactivity, the BDH/BDH CQ sourcing, the three required papers, the accessibility pass, and the README's required content — is genuinely in place, not just claimed to be.
