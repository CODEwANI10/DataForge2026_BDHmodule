# AI Assistance & License Disclosure

This document is required by the DataForge 2026 Pathway Track rules. It must be filled in with the team's real answers before submission — placeholders below are marked `[ ]` and must not be left blank.

**The rule:** every AI-generated or AI-reused component — code, writing, design, or research — must be disclosed here, and every team member must be able to defend how it was used and why it's correct if a judge asks. "AI helped" is not a defense; "AI drafted X, I verified Y against the primary source and changed Z" is.

---

## 1. AI Assistance Disclosure

Team: Aniket Anand Khot, Devansh Dheeraj Agrawal, Deep Vaibhav Lokhande, Yash Manoj Dhatrak — Pune Vidyarthi Griha's College of Engineering, Technology and Management, Pune.

Overall split of AI involvement in this project: **Claude ≈ 20%** (basic/scaffolding coding assistance and research support), **ChatGPT ≈ 10%** (research support — literature search and summarization pointers), **remaining ≈ 70%** original team work (design decisions, the falsifiable claim, the interaction design, verification, and integration). Research was additionally grounded in publicly available sources (arXiv papers and the primary BDH / BDH CQ technical reports).

| Component | AI tool used | What the AI did | What a team member did (verify/edit/write) | Verified against primary source? |
|---|---|---|---|---|
| `src/App.jsx` — Hopfield math (store/update/converge/noise) | Claude | Drafted initial implementations of `storePattern`, `updateState`, `converge`, and `addNoise` from the standard Hebbian/synchronous-update formulas | Team read, ran, and hand-traced the matrix math against the textbook Hopfield update rule; adjusted preset patterns and capacity constant | [x] Yes — checked against the standard Hebbian learning rule and synchronous update rule, and against Stojnic (2024) for the capacity constant |
| `src/App.jsx` — guided walkthrough & comprehension check UI | Claude | Drafted the walkthrough/highlight logic and the comprehension-check component structure | Team wrote the actual question text/answer key and wired the unlock condition to real Store/Retrieve state | [x] Yes — logic and behavior tested manually in-browser |
| `src/App.jsx` / `src/index.css` — accessibility & responsive pass | Claude | Suggested ARIA roles/attributes and responsive breakpoints | Team applied and tested with keyboard navigation and at multiple viewport widths | [x] Yes — manually tested, not just AI-asserted |
| BDH tab content (equations, comparison text) | Claude + ChatGPT (research support) | Helped summarize and structure comparison points between classical Hopfield memory, BDH, and BDH CQ | Team fetched and read the BDH and BDH CQ primary technical reports directly and rewrote/corrected the comparison text against them, including section citations | [x] Yes — checked against BDH and BDH CQ primary technical reports directly (see `PAPERS.md` / README §"Accuracy") |
| `PAPERS.md` | ChatGPT (initial research pointers) + Claude (formatting/pairing to claims) | Helped locate candidate papers and draft citation formatting | Team verified each arXiv ID, abstract, and claimed result directly before inclusion | [x] Yes — verified against arXiv:2403.01907, arXiv:2202.04557, arXiv:2309.12673 directly |
| `README.md` | Claude | Drafted structure and initial prose | Team edited for accuracy and filled in project-specific detail | [x] Yes |
| `BLOG.md` / `BLOG.pdf` | Claude (drafting) + ChatGPT (research support) | Drafted prose and helped surface background papers | Team fact-checked numbers/claims and rewrote sections to match the team's own judgment | [x] Yes — verified against arXiv:2402.01032 and arXiv:2312.00752 directly |
| `DEFENSE_SHEET.md` | Claude | Helped draft anticipated Q&A structure | Team wrote the actual answers they will give live | [x] Yes |
| [add rows as needed] | | | | |

**Statement:**
> "Our team (Aniket Anand Khot, Devansh Dheeraj Agrawal, Deep Vaibhav Lokhande, Yash Manoj Dhatrak) used Claude (~20%) for basic coding scaffolding and research assistance, and ChatGPT (~10%) for additional research support, alongside publicly available sources (arXiv papers, the BDH and BDH CQ primary technical reports) for our own research. Every technical claim about BDH, BDH CQ, or the cited 2022–2026 papers was checked by the team directly against the primary source before inclusion. Every piece of AI-drafted code was read, run, and understood by the team before submission."

---

## 2. Source & License Record

| Component | Source (original / reused / forked) | License | Notes |
|---|---|---|---|
| Demo code (`src/App.jsx`, `src/main.jsx`, `src/index.css`) | Original (AI-assisted, see §1 above) | MIT License (this project) | Written for this project from scratch with Claude/ChatGPT assistance as disclosed in §1; not forked from any starter template. |
| React | Reused (npm dependency) | MIT License | `react` ^18.2.0, `react-dom` ^18.2.0 — see `package.json`. |
| Vite | Reused (npm devDependency) | MIT License | `vite` ^4.4.0, `@vitejs/plugin-react` ^4.0.0 — build tooling only, not shipped to end users at runtime. |
| Fonts | None used | N/A | The app uses `system-ui` / OS default fonts — no external font files or CDN font loads. State explicitly on submission if this changes. |
| Images / icons | None used | N/A | All visuals (pattern grids, weight heatmap) are generated programmatically from CSS/DOM — no image or icon assets. |
| Data / preset patterns | Original | N/A | The 5×5 letter patterns (T, O, X, L, H) in `PATTERNS` are hand-authored for this demo, not sourced from an external dataset. |
| Forked starter code | No | N/A | This project was not forked from any starter template — it was built from a fresh Vite + React scaffold. |

**Fork flag:** [ ] This project forked existing starter code. [x] This project did not fork existing starter code.

---

*Cross-reference: this document is referenced from the Credits and Licenses section of README.md. Keep both in sync.*
