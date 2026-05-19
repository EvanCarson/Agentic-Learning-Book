# Custom 404 Page — Design Spec

**Date:** 2026-05-19
**Status:** Approved (with execution amendment — see below)

> **Execution amendment (2026-05-19):** the e2e (Testing section) was
> implemented with the `console`-error filter additionally ignoring the
> exact line `Failed to load resource: the server responded with a
> status of 404 (Not Found)` — on top of the existing `favicon`
> exclusion. A page served at HTTP 404 inherently makes the browser log
> that benign resource-status line; it is not a page defect, so the
> original "favicon-only" filter could never pass. `pageerror` capture
> remains strict (any real JS error still fails) and the exact-string
> match cannot mask a different failure. Where this spec says "the same
> filter the landing test uses (favicon)" / "with the existing favicon
> filter", read it as "favicon plus that exact inherent 404-status
> line".
**Program context:** Agentic Learning Book — static Astro 6 site on
Vercel (no SSR/adapter). Unknown URLs currently fall through to a bare
host 404 with none of the site chrome or design system. This cycle adds
a styled custom 404 and folds a one-line documentation correction.

## Goal

An unknown URL renders a branded, design-system-consistent 404 page that
routes the visitor back into the curriculum — with no SSR, no new
dependency, and no behavior change to any existing route.

## Locked decisions

- **Mechanism:** a single `src/pages/404.astro`. Astro's static build
  emits it as `dist/404.html`; Vercel's Astro static framework preset
  serves that for any not-found path automatically. **No `vercel.json`
  change** (verified: the existing `vercel.json` only sets
  framework/build/output/install — no `routes`/`rewrites`/`cleanUrls`
  that would override 404 handling).
- **Chrome/styling:** uses `BaseLayout` exactly like `src/pages/index.astro`
  (Header, footer, favicon, Inter, slate/indigo-violet tokens, dark
  mode) — no duplicated chrome or CSS.
- **Content:** one `<h1>` "404 — page not found", a one-line muted
  message, a primary button to `/learn` and a secondary plain link to
  `/`.
- **No client JS / no islands / no redirects change.** Static only.
- **Mandatory e2e** added (project Definition of Done): an unknown URL
  renders the custom page with zero console/page errors.
- **Folded doc fix:** correct the one-line wording in
  `docs/superpowers/specs/2026-05-18-agent-execution-d2-design.md` that
  cites `callRealModel`/`PyRunner` as the untouched engine — the module
  that exports `callRealModel` is `src/lib/realPolicy.ts`. Docs-only.

## Architecture / components

- **`src/pages/404.astro`** (new) — mirrors the `index.astro` structure:
  - `<BaseLayout title="Page not found">`.
  - `<section class="mx-auto max-w-3xl py-20 text-center sm:py-28">`:
    - `<h1 class="text-balance text-5xl font-extrabold tracking-tight
      text-slate-900 sm:text-6xl dark:text-white">404 — page not
      found</h1>` — text deliberately distinct from the landing `h1`
      ("Learn to build AI agents") so e2e role/heading locators never
      collide.
    - `<p class="mx-auto mt-5 max-w-xl text-lg text-slate-600
      dark:text-slate-400">` one-line message, e.g. "That page does not
      exist. Head back to the curriculum."
    - `<a href="/learn" class="btn-primary mt-9 px-6 py-3 text-base">`
      primary CTA (e.g. "Go to the curriculum →").
    - a secondary `<a href="/" class="...muted link...">` "Home".
  - Exactly one `h1`; the nav landmark comes from `BaseLayout`'s
    `Header`. No `client:*`, no React island.
- **`e2e/site.spec.ts`** (modify, add one test) — inside the existing
  site/`curriculum` describe, a test that:
  - captures `pageerror` and `console` errors with the same filter the
    landing test uses (ignore messages containing `favicon`),
  - `await page.goto("/this-route-does-not-exist")` (the dev/preview
    server returns the 404 body; assertions are on content, not HTTP
    status),
  - asserts the heading **"404 — page not found"** is visible
    (`getByRole("heading", { level: 1, name: /404/ })`),
  - asserts the primary CTA resolves to `/learn` — scoped to the page
    body to avoid colliding with the Header's existing "Curriculum"
    link: `page.getByRole("main").getByRole("link", { name: /Go to the
    curriculum/i })` → `toHaveAttribute("href", "/learn")` (so the CTA
    link text must be distinct from the Header link, e.g. "Go to the
    curriculum →", not just "Curriculum"),
  - asserts zero captured errors.
  No existing test is modified.
- **`docs/superpowers/specs/2026-05-18-agent-execution-d2-design.md`**
  (modify) — one-line wording correction (`callRealModel` →
  `src/lib/realPolicy.ts`). No other doc content changes.

## Data flow / behavior

Build-time only: `npm run build` statically renders `404.astro` to
`dist/404.html`. At runtime Vercel serves `dist/404.html` (HTTP 404) for
any path with no matching static asset. No request-time code runs. All
existing routes, the `/tutorials/*`→`/learn/*` redirect, the
content collection, progress, and runtime components are untouched.

## Error handling

- The page is pure static markup; it cannot itself error at runtime
  (no JS). The e2e asserts a clean console/page-error capture (the same
  bar every page in the suite already meets), with the existing
  `favicon` filter.
- If a future `vercel.json` ever adds rewrites/routes, 404 handling
  must still resolve to `dist/404.html` — out of scope here (verified
  not the case now); noted so it isn't silently broken later.

## Testing (Definition of Done)

- `npm run typecheck` (`astro check`) → 0 errors / 0 warnings / 0 hints.
- `npm run build` → green; page count **51 → 52** (the new 404 route);
  `dist/404.html` present and contains the heading text.
- `npm test` → unchanged green (no unit logic touched).
- **e2e (mandatory gate):** the full networked Playwright suite green,
  including the new 404 test and every existing test unchanged
  (landing, syllabus, prev/next, mark-complete, both quiz tests, the
  live-Pyodide anchor, both model-settings tests, the reworked-lesson
  mock test, the redirect).

## Out of scope

- A 500 / other custom error pages; any SSR or Vercel adapter.
- `vercel.json` restructuring; redirects/rewrites changes.
- Search, suggested-links, or any dynamic "did you mean" behavior on
  the 404 (YAGNI).
- Subsystem A, CI workflow, the manual real-mode smoke check.
