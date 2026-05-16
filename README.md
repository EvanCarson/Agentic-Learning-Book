# Agentic Learning Book

An interactive web app teaching agentic AI. Tutorials are MDX; the Python
code runs entirely in your browser via Pyodide (no backend).

**Live:** https://agentic-learning-ruddy.vercel.app

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
```

## Verify

```bash
npm test         # unit tests (navigation helper, Vitest)
npm run typecheck # astro check — authoritative type gate
npm run build    # static site -> dist/ (validates content schema)
npm run e2e      # Playwright headless UI tests (mandatory gate)
```

Note: `npm run build` uses esbuild and does NOT type-check. Always run
`npm run typecheck` for type validation.

`npm run e2e` is the **mandatory UI-testing gate** (see "Definition of
Done" in CLAUDE.md): it builds, serves, and drives a headless browser —
rendering checks, navigation, and a live PyRunner run that asserts the
real in-browser Python output. It needs network access to the Pyodide
CDN; run `npx playwright install chromium` once first. Locally, if a
stale `npm run preview` is running, use `CI=1 npm run e2e` to force a
fresh build.

## Add a tutorial

Create `src/content/tutorials/NN-slug.mdx` with frontmatter
`title`, `order`, `summary`. It appears in the sidebar automatically,
ordered by `order`. Embed a runnable snippet with:

```mdx
import PyRunner from "../../components/PyRunner.tsx";

<PyRunner client:visible code={`print("hello")`} />
```

## Known limitations

- **PyRunner code indentation:** MDX normalizes the indentation of the
  template literal passed to the `code` prop of `<PyRunner />`, reducing
  the first level from 4 spaces to 2 (and nested blocks from 8 to 6). The
  sample code still runs correctly — indentation stays consistent within
  each block. But when adding lines in the editor, match what is already
  shown (2-space top-level bodies, 6-space nested blocks); introducing
  PEP 8 4-space lines into an existing 2-space block raises
  `IndentationError`. A future improvement is to load snippet code from a
  separate raw-imported `.py` file to preserve exact whitespace.
- **In-browser Python run requires a real browser:** `build`/`typecheck`/
  unit tests do not exercise the live Pyodide runtime. This is covered by
  the automated `npm run e2e` gate (and can also be checked manually
  below). It needs network access to the Pyodide CDN.

## Manual verification (Pyodide runtime)

Automated coverage is `npm run e2e`. Quickest manual check: open the live
site at https://agentic-learning-ruddy.vercel.app/tutorials/01-what-is-an-agent
and press **Run**. To check a local build instead:

```bash
npm run build    # required before preview — serves dist/
npm run preview
```

Open `http://localhost:4321/tutorials/01-what-is-an-agent`, press **Run**.
After a Pyodide load delay the output panel should show:

```
obs='unknown topic' -> action='search'
obs='known fact' -> action='answer'
obs='unknown thing' -> action='search'
```

## Deploy (Vercel)

**Live and git-connected.** The repo is connected to Vercel: every push
to `main` deploys to production (https://agentic-learning-ruddy.vercel.app),
and PRs/branches get preview deployments automatically. Verified in
production: pages render and the in-browser PyRunner executes Python
correctly.

Configured via `vercel.json` (framework `astro`, build `npm run build`,
output `dist/`, install `npm ci`). Fully static — no serverless adapter.
**CLI alternative:** `npm i -g vercel`, then `vercel` / `vercel --prod`.

> **CI caveat:** Vercel's pipeline only runs `npm run build`. It does
> **not** run the mandatory gates (`npm test`, `npm run typecheck`,
> `npm run e2e` — see CLAUDE.md "Definition of Done"). There is no
> GitHub Actions workflow enforcing them, so these gates are
> **local-only**: run them before merging to `main`, or a buildable-but-
> broken change can ship.

Served at a domain root, so absolute links work as-is (no `base` path).
The build output (`dist/`) is also hostable on any static host.
