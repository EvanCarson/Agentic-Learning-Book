# CLAUDE.md

Guidance for working in this repository.

## Project

Agentic Learning Book — a static, interactive web app teaching agentic AI.
Tutorials are MDX; Python snippets run **entirely in the browser** via
Pyodide (CPython→WASM). No backend, no accounts, no database. Deployable to
any static host.

## Commands

```bash
npm run dev        # dev server, http://localhost:4321
npm test           # Vitest unit tests (navigation helper)
npm run typecheck  # astro check — AUTHORITATIVE type gate
npm run build      # static build -> dist/ (validates content schema)
npm run preview    # serve dist/ (run build first)
```

**Critical:** `npm run build` uses esbuild and does **not** type-check.
Always run `npm run typecheck` (`astro check`) for type validation — it is
the real gate. CI/verification must run all three: test, typecheck, build.

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
they do not load WASM, run JavaScript, or render styles. Until automated
browser UI tests exist, this check is **manual and mandatory**; record
that it was performed and its result before claiming completion.

## Architecture

- **Stack:** Astro 6 (static), React 19 islands, Tailwind v4 (`@tailwindcss/vite`
  + `@tailwindcss/typography`), MDX, TypeScript strict.
- **Content:** `src/content.config.ts` defines the `tutorials` collection
  (Astro 6 content layer — `glob` loader, `z` imported from `zod` directly,
  NOT from `astro:content`). Schema: `title`, `order`, `summary`.
- **Tutorials:** `src/content/tutorials/NN-slug.mdx`. The entry `id`
  (filename-derived) is the slug used everywhere.
- **Routing:** `src/pages/tutorials/[...slug].astro` static-generates one
  page per entry via `getStaticPaths`, renders MDX with `render(entry)`.
- **Layouts:** `BaseLayout.astro` (HTML shell, global.css, Header) →
  `TutorialLayout.astro` (Sidebar + prose article + prev/next).
- **Navigation:** `src/lib/navigation.ts` — pure `getAdjacentTutorials`,
  unit-tested (`tests/navigation.test.ts`). The only non-trivial logic.
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
- In-browser Pyodide execution and visual rendering are **manual** checks —
  not covered by automated build/typecheck/tests. See README.

## Adding a tutorial

Drop `src/content/tutorials/NN-slug.mdx` with `title`/`order`/`summary`
frontmatter. It auto-appears in the sidebar (ordered by `order`) and gets a
route. Use pure-Python snippets (no network/`pip`) so they run in Pyodide.
