# Baroque Art

The **Museum With No Frontiers — Discover Baroque Art** website: permanent
collection, full-text database, country timelines, partners and virtual
exhibitions, built from the published dataset.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@metanull` packages from GitHub Packages:

| Package | Role |
| --- | --- |
| `@metanull/baroqueart-data` | the dataset (JSON + `manifest.json`, **private**) |
| `@metanull/viewer-core` | application engine (routing, data access, i18n) |
| `@metanull/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

Because the data package is private, every `npm install` needs authenticated
access to GitHub Packages. In CI there is nothing to configure: the package
grants this repository Read under *Manage Actions access*, so the workflow's
built-in `github.token` can install it — no secret, no PAT. Locally, each
developer authenticates for themselves, with `npm login --registry=https://npm.pkg.github.com`
or a personal `~/.npmrc`; the Docker preview reads the token from `.env`.

## Dataset specifics

The dataset is the Discover Baroque Art project (legacy project key `BAR`),
and it differs from the Islamic Art dataset in ways that shape the site:

- **Single project.** Everything belongs to one project, so there is no
  project filter anywhere in the interface.
- **No dynasties and no artistic introduction.** The dataset has neither, so
  the site has no pages for them. Its collection tree carries a single
  `purpose` marker, `exhibitions-root`.
- **Uneven language coverage.** `manifest.languages` declares 18 languages,
  but each entity is translated into a different subset — items into 5
  (`cs`, `de`, `en`, `it`, `pt`), collections into 4, partners into 5,
  glossary into 9, countries into 14. Which languages the site offers, and how
  it falls back when the chosen one has no file for an entity, is a design
  decision rather than a lookup.

## Implementation status

The site currently renders the generic entity pages that `viewer-core`
generates by default. Replacing them with the real Baroque Art pages is
tracked by the epic and its stories in this repository's issues.

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
   language code, e.g. `it.json`, paste, and translate the texts.
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
   - In GitHub Desktop: File → Clone repository → pick this repository.
   - In the cloned folder, copy the file `.env.example` to a new file named
     exactly `.env`, open it in any text editor and paste your personal GitHub
     token after `NODE_AUTH_TOKEN=`. It only lets your own computer download
     the website's building blocks; it is personal and never committed.
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
  entities with generated list/detail routes, page shell + navigation, and
  `extraViews` for the site's own pages. `src/main.js` should not need edits.
- Site-specific pages live in `src/views/` and are declared as `extraViews`.
  A route named `home` replaces the engine's generic home page.
- Tests: `npm run test` runs `tests/smoke.test.js`, which mounts the app
  against the real data package. Add website-specific tests next to it.
- CI (`.github/workflows/`) is a set of thin callers of
  [`metanull/viewer-workflows`](https://github.com/metanull/viewer-workflows);
  build + test block, ESLint + `npm audit` report, locale PRs validate and
  auto-merge, Dependabot minor/patch bumps of the platform packages
  auto-merge, a weekly audit opens issues on findings. No workflow takes a
  secret.
- The deployed base path comes from `BASE_PATH` at build time; the deploy
  workflow sets it to `/baroqueart/` for GitHub Pages.
