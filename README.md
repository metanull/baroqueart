# website-template

Template repository for MWNF websites. Every new website repo
(`metanull/<dataset>`, public) is created **once** from this template — it is
never installed as a dependency and never updated in existing websites.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@metanull` packages from GitHub Packages:

| Package | Role |
| --- | --- |
| `@metanull/<dataset>-data` | the dataset (JSON + `manifest.json`) |
| `@metanull/viewer-core` | application engine (routing, data access, i18n, shared views) |
| `@metanull/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

---

## Admin — creating a new website

1. **Use this template.** On this repo's GitHub page, click **Use this
   template → Create a new repository**. Name it after the dataset
   (`metanull/<dataset>`), keep it **public**.
2. **Replace every `__DATASET__` placeholder** with the dataset key
   (e.g. `islamicart`). The placeholder appears in exactly these places:
   - `package.json` — the `name` field and the `@metanull/__DATASET__-data` dependency
   - `vite.config.js` — the `@inventory-data` alias path
   - `src/dataset.config.js` — `datasetPackage`, `siteName`, `navigation.headerTitle`
   - `index.html` — the `<title>`
3. **Grant the new repo access to the dataset package.** On the package page
   (`github.com/users/metanull/packages/npm/package/<dataset>-data`) →
   **Package settings → Manage Actions access → Add repository** → the new
   repo, role **Read**. This is what lets CI install a **private** dataset
   with its built-in `github.token`; no secret and no PAT is involved. The
   grant is UI-only, and only affects workflow runs *started after* it — a run
   that already failed with `403 permission_denied: read_package` has to be
   re-run.
4. **Generate the lockfile.** Run `npm install` once (any machine logged in to
   GitHub Packages, or the Docker container below) and commit
   `package-lock.json` — CI uses `npm ci` and needs it.
5. **Switch on the rails** in the new repo's settings:
   - **Pages** → Build and deployment → Source: **GitHub Actions**.
   - **Ruleset** for `main`: require pull requests + required status checks
     (copy the ruleset of an existing website repo).
   - **General → Allow auto-merge** (needed by the translator flow and Dependabot).
   - **CodeQL** (Security → Code scanning) and Dependabot alerts.
6. **Register the website for downstream testing:** add `"metanull/<dataset>"`
   to `dependents.json` in both `viewer-core` and `viewer-layout`, and grant
   those two repos **Read** on the dataset package as well (step 3) — their
   downstream job installs it.
7. **Update `.github/CODEOWNERS`** with the real reviewers.
8. **Merge the first PR** (the placeholder replacement). The deploy workflow
   publishes the site to `https://metanull.github.io/<dataset>/`.

The CI, deploy and audit workflows carry an
`if: github.repository != 'metanull/website-template'` guard so the template
itself — which has no lockfile and an unresolvable `__DATASET__` dependency —
does not report failing checks. The condition is false in every repository
created from the template, so the checks simply run; there is nothing to
remove.

The deployed base path comes from the `BASE_PATH` environment variable at
build time; the deploy workflow defaults it to `/<repo>/` for Pages. For a
root deployment (custom domain), pass `base_path: /` to the deploy workflow.

---

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
the interface texts (menu labels, buttons, messages), one file per language —
`en.json` is English, `fr.json` French, and so on. The museum content itself
arrives already translated and is not edited here.

1. **Open the folder.** Bookmark this link on the website's GitHub page:
   `locales/`. Click the language file you want to change.
2. **Click the pencil** (✏️, top right of the file view). The file opens in an
   editable text box. Change only the text between the second pair of
   quotation marks on a line — the part before the colon is the identifier
   and must stay exactly as it is. Pieces in curly braces like `{page}` are
   filled automatically — keep them, but you may move them within the
   sentence.
3. **To start a new language**, open `en.json`, copy all of its content, then
   create the new file (Add file → Create new file) named with the two-letter
   language code, e.g. `ar.json`, paste, and translate the texts.
4. **Click "Commit changes…" then "Propose changes".** GitHub asks nothing
   else — it saves your edit as a proposal.
5. **Wait for the automatic check.** After a minute or two, the proposal page
   shows a green tick and your change goes live on the website by itself a few
   minutes later. If something is off (a missing quote, a forgotten `{page}`),
   a comment appears explaining in plain language what to fix — edit again on
   the same page and the check reruns.

---

## Webdesigner — theming the website

The website's whole visual identity lives in the `theme/` folder:
`tokens.css` (colors, fonts, spacing — the normal surface), `overrides.css`
(escape hatch) and `assets/` (logo, banner, sponsor images). Small changes can
be made straight in the browser with the pencil button, like the translator
flow above — styling changes are reviewed, they do not merge automatically.
For real design work, use the live preview:

1. **One-time setup:**
   - Install **Docker Desktop** (docker.com) and **GitHub Desktop**
     (desktop.github.com), each with default settings.
   - In GitHub Desktop: File → Clone repository → pick this website's repo.
   - In the cloned folder, copy the file `.env.example` to a new file named
     exactly `.env`, open it in any text editor and paste your personal
     GitHub token after `NODE_AUTH_TOKEN=` (the admin will tell you how to
     create one). It only lets your own computer download the website's
     building blocks; it is personal, never shared and never committed.
2. **Start the preview:** open a terminal in the folder (GitHub Desktop:
   Repository → Open in Command Prompt) and run:

   ```bash
   docker compose up
   ```

   The first start downloads everything and takes a few minutes; wait until a
   line shows `Local: http://localhost:5173/`, then open
   **http://localhost:5173** in your browser.
3. **Edit `theme/`, watch it live.** Every save refreshes the browser
   automatically. `tokens.css` lists every knob with a comment; put images
   into `theme/assets/` and reference them from `src/dataset.config.js`
   (banner, sponsor logos). Anything a token cannot express goes into
   `overrides.css`. A change to a layout component itself is a request for the
   `viewer-layout` package — open an issue there and a developer pairs on it.
4. **Propose your changes:** in GitHub Desktop, write a short summary bottom
   left → **Commit** → **Push origin** → **Create Pull Request** (opens in the
   browser → green **Create pull request** button). After a colleague approves
   it, the change merges and deploys by itself. Stop the preview with
   `Ctrl+C` in the terminal when done.

---

## Developer notes

- `src/dataset.config.js` is the website's whole declaration: dataset package,
  entities with list/detail routes, page shell + navigation, extra views.
  `src/main.js` should not need edits.
- Tests: `npm run test` runs `tests/smoke.test.js`, which mounts the app
  against the real data package. Add website-specific tests next to it.
- Extra pages go into `src/views/` and are declared as `extraViews` in
  `dataset.config.js`.
- CI (`.github/workflows/`) is a set of thin callers of
  [`metanull/viewer-workflows`](https://github.com/metanull/viewer-workflows);
  build + test block, ESLint + `npm audit` report, locale PRs validate and
  auto-merge, Dependabot minor/patch bumps of the platform packages
  auto-merge, a weekly audit opens issues on findings.
