# UI Redesign v1 — Design Spec

**Date:** 2026-05-17
**Status:** Approved
**Program context:** A cohesive visual-design pass over the Agentic
Learning Book site. The information architecture, routing, content,
progress logic, and interactive runtime are already built and merged
(Subsystems B, E, D, C). This work is a **visual layer only** — a design
system plus per-page/component restyle. It changes no DOM structure,
roles, accessible names, heading levels, behavior, content, or tests.

## Goal

Replace the stock-Tailwind bare appearance with a cohesive, modern
**developer-tool** aesthetic (Linear / Stripe-docs / Astro register):
a token-driven design system, self-hosted typography, an
indigo→violet accent on a slate neutral palette, real visual hierarchy,
module-grouped navigation, and visible learning progress — while keeping
the solid existing layout/semantics/accessibility and every test green.

## Locked decisions

- **Scope:** cohesive design system + polish. No new **runtime**
  dependencies; no layout/DOM/behavior/content/test changes. The only
  new packages are dev-time `@fontsource/*` font assets bundled into the
  static build.
- **Aesthetic:** modern developer-tool — restrained neutral palette,
  one confident accent, crisp typography, subtle borders/shadows,
  generous whitespace, strong code/quiz surfaces.
- **Accent:** an **indigo→violet** accent ramp on a **slate** neutral
  palette. Used for primary actions, links, active/`aria-current`
  states, completion, and progress.
- **Typography:** self-host **Inter** (UI/body) and **JetBrains Mono**
  (code) via `@fontsource` (devDependencies; emitted into `dist/`,
  zero external requests, zero runtime JS dependency).
- **Dark mode:** keep the existing Tailwind `dark:` class strategy;
  tune slate surfaces so dark mode is intentional, not inverted gray.
- **Hard invariant:** no change to DOM structure, element roles,
  `aria-*`, heading levels, accessible names, link `href`s, visible
  text strings asserted by tests, or the `name="alb-*"` /
  `pre[aria-live="polite"]` runtime anchors. All restyling is
  className/CSS only.

## Architecture

Token layer first, then consume it everywhere.

- **`src/styles/global.css`** — the single source of truth. A
  Tailwind v4 `@theme` block defines:
  - **Neutral scale:** slate `--color-slate-50 … 950` (Tailwind's
    slate is acceptable; alias semantic names below).
  - **Accent ramp:** `--color-accent-50 … 950` (indigo at the low/mid
    range shifting toward violet at the high end).
  - **Semantic aliases:** surface (page/raised/sunken), border,
    text (default/muted/subtle), accent-fg, focus-ring.
  - **Typography:** `--font-sans` (Inter, then system fallback),
    `--font-mono` (JetBrains Mono, then system mono).
  - **Radius:** `--radius-md` (controls), `--radius-lg` (cards),
    plus a small/full as needed.
  - **Shadow:** a subtle 2–3 step elevation scale.
  - Imports the `@fontsource` font CSS (Inter 400/500/600/700;
    JetBrains Mono 400/500) so the fonts ship in the build.
  - A small set of shared component classes via `@apply`
    (`.btn`, `.btn-primary`, `.btn-secondary`, `.card`, `.badge`,
    `.progress`) to keep restyle DRY and consistent.
- **`public/favicon.svg`** — a minimal monogram mark (small brand
  touch, not a rebrand), referenced from `BaseLayout`'s `<head>`.
- Every `.astro`/`.tsx` view consumes the tokens via Tailwind utility
  classes referencing the themed scale and the shared component
  classes. No inline raw hex; no per-component bespoke palettes.

## Per-surface changes (DOM/text/roles preserved everywhere)

- **`BaseLayout.astro` / `Header.astro`:** sticky header with a small
  wordmark and a thin accent top-border; refined nav with a clear
  active state (keep the existing `aria-current`); a minimal footer;
  consistent max-width and vertical rhythm; `<head>` gains the
  favicon, `lang`, font preload. The `<main>` wrapper stays.
- **Landing (`src/pages/index.astro`):** same copy, restructured —
  a confident hero (the existing `h1` "Learn to build AI agents" and
  the "Start the curriculum" CTA text are unchanged), a compact
  three-item "read · run real code · check yourself" row, and a short
  curriculum-at-a-glance strip so the page is no longer mostly empty.
- **Syllabus (`/learn` + `SyllabusView.tsx`):** the flat list becomes
  **module cards** — each module a `.card` with title (keep the `h2`),
  summary, a per-module progress meter, and tidy lesson rows (type
  badge, est-min, ✓/○ with accent fill when done — keep the
  `sr-only" (completed)"` text and link `href`s). A top overall
  progress bar ("N of M complete"); "Continue where you left off"
  promoted to a prominent primary button (text unchanged).
- **Lesson page (`LessonLayout.astro` + `SidebarNav.tsx`):** sidebar
  grouped by module with clear section headers and a strong accent
  current-lesson state (`aria-current="page"` preserved); sidebar
  scrolls independently. Reading column: tuned `prose` (measure,
  headings, links, inline/block code, the "best practice" blockquote).
  Prev/next become card-style links (same `href`s/labels).
  `MarkComplete` restyled (button text "Mark complete"/"Completed"
  and `aria-pressed` preserved).
- **Interactive & quiz components** (`PyRunner.tsx`, `PolicyRunner.tsx`,
  `ModelSettings.tsx`, `Quiz.tsx`): restyled within their **exact
  existing DOM** — mono-font editor-style code surfaces, themed
  Run/Submit buttons, quiz options as selectable cards, themed
  result/score. All `role`, `aria-live`, button accessible names,
  the radio `name="alb-q-${i}"` / `name="alb-model-mode"` groups, the
  `aria-label="API key"` field, and the `pre[aria-live="polite"]`
  output anchor are unchanged.

## Accessibility

- Color contrast for the new palette meets WCAG AA for body text and
  UI text in **both** light and dark mode (verify accent-on-surface
  and text-on-surface pairs).
- Visible keyboard focus styling using the accent focus-ring token on
  all interactive elements.
- No reliance on color alone (completion/quiz correctness keep their
  text/symbol labels).
- Existing landmarks, `aria-current`, `aria-live`, labelled controls,
  and heading order are preserved exactly.

## Constraints

- No new runtime dependencies. `@fontsource/inter` and
  `@fontsource/jetbrains-mono` are added to **devDependencies**
  (build-time assets), consistent with the repo's deps convention.
- No SSR/adapter/config changes beyond what Tailwind v4 + the font
  imports require in `global.css`. Stays a static build on Vercel.
- No changes to content (`.mdx`), curriculum/progress logic, schema,
  routing, or redirects.
- Purely additive/visual: a reviewer must be able to confirm the diff
  touches only styles, class names, and presentational markup
  wrappers — never roles, text asserted by tests, or behavior.

## Testing (Definition of Done)

- **Type/build:** `npm run typecheck` (`astro check`) 0/0/0;
  `npm run build` green, 51 pages.
- **Unit:** `npm test` unchanged green (no logic touched).
- **e2e (mandatory gate):** `npm run e2e` — **all 10** Playwright
  tests pass unchanged (landing CTA/heading; syllabus module
  headings + lesson links; prev/next; mark-complete persistence; the
  two quiz tests; the live-Pyodide interactive anchor; the two
  model-settings tests; the redirect). The restyle must not alter any
  locator (role, accessible name, text, or the runtime anchors).
- **Visual confirmation:** a fresh headless screenshot pass of
  landing, `/learn`, a reading lesson, an interactive lesson, and the
  quiz, in light and dark, attached for review (before/after).
- Manual contrast check of the final palette in light + dark.

## Out of scope

- Brand identity beyond the wordmark + favicon (no logo system,
  illustration, marketing site).
- Any content, copy, curriculum, routing, or behavior change.
- New interactive features, animations beyond subtle transitions, or
  motion design.
- Mobile-app-style navigation rework (responsive polish only within
  the existing layout).
- Subsystem A (accounts), D Cycle 2, remaining quiz authoring, CI/404
  — tracked separately.
