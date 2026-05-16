# Agentic Learning Book

An interactive web app teaching agentic AI. Tutorials are MDX; the Python
code runs entirely in your browser via Pyodide (no backend).

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

Automated coverage is `npm run e2e`. To check by hand instead:

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

This site is fully static and configured for Vercel via `vercel.json`
(framework `astro`, build `npm run build`, output `dist/`, install
`npm ci`). No serverless adapter is used.

**Git-connected (recommended):** Import the repo at vercel.com → New
Project. Vercel reads `vercel.json`; every push to the default branch
deploys to production, and other branches/PRs get preview deployments.

**CLI:** `npm i -g vercel`, then `vercel` (preview) or `vercel --prod`.

`vercel.json` pins the build so local and Vercel builds match. The
mandatory `npm run e2e` UI gate (see CLAUDE.md "Definition of Done") is
NOT run by Vercel's build — run it in CI or locally before deploying.

Being served at a domain root, the existing absolute links work as-is
(no `base` path needed). The build output (`dist/`) is also hostable on
any other static host.
