# Deployment & Public Repository Setup

I don't have GitHub account/hosting access from this environment, so nothing below has actually been deployed. These are exact, actionable steps for whoever on the team runs them, plus what's missing before that can happen.

**Note — this differs from a static-HTML deployment:** this project is a Vite + React app, not a single static `index.html` you can double-click. It needs a build step (`npm run build`) before it can be hosted; the *source* `index.html` at the repo root is Vite's dev entry point, not the deployable artifact.

## 1. Recommended hosting: Vercel or Netlify

**Why not plain GitHub Pages by default:** GitHub Pages can host the `dist/` output, but Vercel/Netlify auto-detect Vite projects, run the build for you on every push, and give a stable HTTPS URL with zero manual "build then push dist/" steps — simpler for a team without a CI pipeline already set up. GitHub Pages remains a valid fallback (see §4) if the team prefers to keep everything inside one GitHub-only workflow.

## 2. Step-by-step (Vercel)

1. Push this project to a new **public** GitHub repository (e.g. `hopfield-explainer`):
   ```bash
   cd hopfield-explainer
   git init
   git add .
   git commit -m "Initial commit: Hopfield Associative Memory Explainer"
   git branch -M main
   git remote add origin https://github.com/<your-org-or-username>/hopfield-explainer.git
   git push -u origin main
   ```
2. Confirm on GitHub.com that the repo shows **Public**, and that `package.json`, `index.html`, and `src/` are visible at the repo root.
3. Go to vercel.com → **Add New Project** → import the GitHub repo.
4. Vercel should auto-detect **Vite** as the framework. Confirm: Build command `npm run build`, Output directory `dist`, Install command `npm install`.
5. Deploy. Vercel gives a stable public URL (e.g. `https://hopfield-explainer.vercel.app`) that requires no sign-in to view.

## 3. Step-by-step (Netlify) — equivalent alternative

1. Same repo push as above.
2. netlify.com → **Add new site → Import an existing project** → select the repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Deploy. Netlify gives a stable public URL (e.g. `https://hopfield-explainer.netlify.app`).

## 4. Step-by-step (GitHub Pages) — fallback, requires one extra step

GitHub Pages doesn't run a build for you, so either build locally and push `dist/` to a `gh-pages` branch, or add a GitHub Actions workflow that runs `npm run build` and publishes `dist/` on every push. If going this route, also set `base: '/hopfield-explainer/'` in `vite.config.js` (repo-name subpath), or asset paths will break on the deployed site.

## 5. Verification checklist

- [ ] Repository is public (checked in **Settings → General**).
- [ ] `npm install && npm run build` succeeds locally with no errors before pushing.
- [ ] `npm run preview` (serves the production build locally) shows a working app before deploying.
- [ ] Public artifact URL opens with no sign-in — test in a logged-out/incognito window.
- [ ] All required submission files are present in the repository root:
  - [x] `index.html`, `package.json`, `vite.config.js`, `src/` — present.
  - [x] `LICENSE` — present (MIT; **replace the copyright holder placeholder before publishing**).
  - [x] `README.md` — present.
  - [x] `BLOG.pdf` (+ `BLOG.md`) — present.
  - [x] `PAPERS.md` — present.
  - [x] `AI_DISCLOSURE.md` — present (fill in the `[ ]` placeholders before publishing).
  - [x] `content/claim-and-limitations.md` — present.
  - [ ] `content/bdh-module.md` — not written as a separate file; the equivalent content lives inline in the app's "BDH Connection" tab (`src/App.jsx`). Confirm this satisfies the judging rubric's "substantial BDH section" requirement, or split it into a standalone file if judges expect one.
- [ ] Public repository URL is accessible logged-out / incognito.

## 6. Placeholders

- **Public artifact URL:** `[FILL IN AFTER DEPLOY]`
- **Public GitHub repository URL:** `[FILL IN AFTER REPO CREATION]`

**Deployment has not actually happened as part of this task** — no GitHub/hosting account access is available from this environment. The steps above are ready to run as-is once someone with access executes them.
