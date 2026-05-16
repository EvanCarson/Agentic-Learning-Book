# CLAUDE.md

Guidance for working in this repository.

## Project

Agentic Learning Book — a static, interactive web app teaching agentic AI.
Tutorials are MDX; Python snippets run **entirely in the browser** via
Pyodide (CPython→WASM). No backend, no accounts, no database. Deployable to
any static host.

## Deployment

**Live:** https://agentic-learning-ruddy.vercel.app — git-connected to
Vercel. Push to `main` → production; PRs/branches → preview deployments.
Verified working in production (pages render, PyRunner runs Python).

Configured by `vercel.json` (no SSR adapter — fully static); `dist/` is
also hostable on any static host. **Critical caveat:** Vercel only runs
`npm run build`. It does NOT run the test/typecheck/e2e gates, and there
is no GitHub Actions workflow — so the Definition-of-Done gates are
**local-only** and MUST be run manually before merging to `main`. A
buildable-but-broken change will otherwise deploy.

## Commands

```bash
npm run dev        # dev server, http://localhost:4321
npm test           # Vitest unit tests (navigation helper)
npm run typecheck  # astro check — AUTHORITATIVE type gate
npm run build      # static build -> dist/ (validates content schema)
npm run preview    # serve dist/ (run build first)
npm run e2e        # Playwright headless browser UI tests (MANDATORY gate)
```

**Critical:** `npm run build` uses esbuild and does **not** type-check.
Always run `npm run typecheck` (`astro check`) for type validation — it is
the real gate. Full verification runs all four: test, typecheck, build,
**e2e**.

`npm run e2e` builds and previews automatically (its Playwright `webServer`
runs `npm run build && npm run preview`). Locally, `reuseExistingServer` is
on: if you already have a stale `npm run preview` running, e2e tests it
without rebuilding — run `CI=1 npm run e2e` (or stop the old preview) to
force a fresh build. The PyRunner e2e requires network access to the
Pyodide CDN (`cdn.jsdelivr.net`); it fails honestly if the CDN is
unreachable rather than silently passing.

## Definition of Done

Work is **NOT done** until UI testing has been performed. Build,
typecheck, and unit tests passing is necessary but **not sufficient** —
they do not exercise the rendered UI or the in-browser Pyodide runtime.

Before any change is considered complete, UI testing must verify, in a
real browser (or headless browser automation):

1. The landing page and tutorial pages render correctly (layout, Tailwind
   styles applied, no console errors).
2. The `PyRunner` widget loads Pyodide, executes the sample Python on
   **Run**, and displays the expected output.
3. Navigation works (sidebar links, prev/next, active-link highlighting).

Server-up / HTTP-200 / HTML-content smoke tests do **not** satisfy this —
they do not load WASM, run JavaScript, or render styles.

This gate is automated: **`npm run e2e`** (Playwright, headless Chromium)
covers all three items above, including a live PyRunner run that asserts
the real Python output. Completion claims must include a passing
`npm run e2e` result. If the environment cannot reach the Pyodide CDN,
the PyRunner test fails honestly — run it where the CDN is reachable
(or in CI) and report the real result; never claim done on a skipped or
CDN-blocked PyRunner test.

## Architecture

- **Stack:** Astro 6 (static), React 19 islands, Tailwind v4 (`@tailwindcss/vite`
  + `@tailwindcss/typography`), MDX, TypeScript strict.
- **Content:** `src/content.config.ts` defines the `lessons` collection
  (Astro 6 content layer — `glob` loader, `z` imported from `zod` directly,
  NOT from `astro:content`). Schema: `title`, `moduleId`, `order`,
  `type` (`reading` | `interactive` | `quiz`), `summary`, `estMinutes`.
- **Module config:** `src/content/modules.ts` — typed `Module[]` defining
  module ids (`foundations`, `patterns`, …), titles, and ordering.
- **Lessons:** `src/content/lessons/NN-slug.mdx`. The entry `id`
  (filename-derived) is the slug used everywhere.
- **Routing:** `src/pages/learn/index.astro` (syllabus/curriculum overview)
  and `src/pages/learn/[...slug].astro` (single lesson, static-generates one
  page per entry via `getStaticPaths`, renders MDX with `render(entry)`).
- **Redirects:** `/tutorials/[...slug]` → `/learn/[...slug]` (in
  `astro.config.mjs`) so the live production URL keeps working.
- **Layouts:** `BaseLayout.astro` (HTML shell, global.css, Header) →
  `LessonLayout.astro` (Sidebar + prose article + prev/next).
- **Curriculum logic:** `src/lib/curriculum.ts` — pure `buildCurriculum` /
  `adjacent`, unit-tested (`tests/curriculum.test.ts`). The only non-trivial
  logic.
- **Progress:** `src/lib/progress/` — `ProgressStore` interface,
  `LocalStorageProgressStore` implementation, `useProgress` React hook.
  localStorage now; Supabase later behind the same sync interface.
- **React islands:** `Sidebar`, `Syllabus`, `MarkComplete`, `QuizStub`.
- **Python runner:** `src/components/PyRunner.tsx` — client island,
  lazy-loads Pyodide from CDN (pinned `0.27.2`) on first Run. Embed in MDX:
  `<PyRunner client:visible code={`...`} />`.

## Conventions

- Runtime deps (`astro`, `react`, `react-dom`, `zod`, `@astrojs/*`) in
  `dependencies`; build/test/type tooling in `devDependencies`.
- Files end with a trailing newline.
- Accessibility is maintained: labelled `<nav>` landmarks, `aria-current`
  on active links, `aria-live` on the Python output. Keep this standard.
- Commits: conventional prefixes (`feat:`, `fix:`, `docs:`, `chore:`,
  `a11y:`, `test:`, `refactor:`).
- Design spec and plan (with execution amendments) live in
  `docs/superpowers/`.

## Known limitations

- MDX normalizes the indentation of the `PyRunner` `code` template literal
  (4-space → 2-space, 8 → 6). Sample code still runs (consistent within
  blocks). A future fix: load snippet code from a raw-imported `.py` file.
- In-browser Pyodide execution and visual rendering require a real browser
  and a CDN-reachable environment — they are **not** exercised by
  `build`/`typecheck`/unit tests alone, but ARE covered by the automated
  **`npm run e2e`** gate (headless Chromium + live PyRunner assertion).

## Adding a lesson

Drop `src/content/lessons/NN-slug.mdx` with frontmatter fields:
`title`, `moduleId`, `order`, `type` (`reading` | `interactive` | `quiz`),
`summary`, `estMinutes`. Module ids come from `src/content/modules.ts`.
The lesson auto-appears in the sidebar and syllabus, ordered by module then
`order`, and gets a `/learn/NN-slug` route. For interactive lessons, embed
`<PyRunner client:visible code={`...`} />` — use pure-Python snippets
(no network/`pip`) so they run in Pyodide.
