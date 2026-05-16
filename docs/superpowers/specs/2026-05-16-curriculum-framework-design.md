# Subsystem B — Curriculum Framework — Design Spec

**Date:** 2026-05-16
**Status:** Approved
**Program context:** First slice of the "job-ready agentic-AI curriculum" product.
See decomposition below; subsystems A/C/D/E are separate spec → plan cycles.

## Program decomposition (for context, not built here)

| # | Subsystem | Depends on |
|---|-----------|-----------|
| **B** | Curriculum framework (THIS spec) | current scaffold |
| A | Accounts + progress backend (Supabase auth + Postgres + RLS) | — |
| D | Agent execution layer (mocked simulator + BYO-key real LLM) | B |
| C | Assessments & certification (quiz engine, projects, certs) | A, B |
| E | Content production (the actual curriculum) | B |

Architecture through-line: Astro static frontend on Vercel; subsystem A later
adds Supabase as a managed backend. BYO-key agent calls (D) stay client-side.

## Goal

Restructure the site from a flat list of tutorials into a single linear
curriculum (modules → lessons), with open navigation, completion tracking,
and a progress store whose backend can later be swapped for Supabase without
UI rework.

## Decisions (locked)

- **Structure:** single linear path → modules → lessons (no track layer).
- **Lesson types:** `reading`, `interactive` (prose + PyRunner), `quiz`
  (type reserved; renders an accessible "coming soon" stub — engine is
  subsystem C).
- **Navigation:** open (all lessons navigable); the path is the recommended
  order. No gating/locking.
- **Progress:** clean `ProgressStore` interface; `LocalStorageProgressStore`
  implementation in this slice. Subsystem A adds `SupabaseProgressStore`
  behind the same interface.
- **Modeling approach (A1):** typed module config + `lessons` MDX
  collection + build-time integrity check.
- **Authoring:** continues the existing MDX-in-repo content-collection
  pattern (git-based).

## Content model

- **Modules** — typed source of order/metadata. `src/content/modules.ts`
  exporting an ordered, typed array of `{ id, title, order, summary }`
  (a typed config module; not MDX). Single source for module ordering.
  (Distinct from `src/lib/curriculum.ts`, which is the pure logic that
  consumes this config — different directory and name to avoid confusion.)
- **Lessons** — MDX collection `src/content/lessons/**/*.mdx`. Frontmatter
  schema (Zod):
  - `title: string`
  - `moduleId: string` (must match a module `id`)
  - `order: number` (int, ≥ 0; ordering within its module)
  - `type: "reading" | "interactive" | "quiz"`
  - `summary: string`
  - `estMinutes: number` (int, > 0)
- **Build-time integrity check** (runs in the content config / a checked
  module imported by it, so failures fail `astro build` and `astro check`):
  - every lesson `moduleId` exists in the module config
  - `(moduleId, order)` pairs are unique
  - every module has ≥ 1 lesson
  - `type` is one of the allowed values (enforced by Zod enum)
  On violation: throw with a precise message naming the offending
  lesson/module.

## Migration of existing content

- The current flat `tutorials` collection and `src/content.config.ts`
  `tutorials` definition are replaced by the `lessons` collection (defined
  in `src/content.config.ts`) + the `src/content/modules.ts` config.
- `src/content/tutorials/01-what-is-an-agent.mdx` becomes
  `src/content/lessons/01-what-is-an-agent.mdx` with added frontmatter
  `moduleId: "foundations"`, `order: 1`, `type: "interactive"`,
  `estMinutes: 10` (kept content + `<PyRunner>`).
- A thin skeleton proves structure: ≥ 2 modules, with at least one
  `reading` lesson and one `quiz`-stub lesson in addition to the migrated
  interactive lesson. (Real curriculum content is subsystem E.)
- Routing: `/tutorials/[...slug]` → `/learn/[...slug]`. The old path issues
  a redirect to the new path so existing/bookmarked links and the
  production URL keep working.
- Landing page CTA points to `/learn`.

## Components / units

Each unit has one responsibility and a defined interface; all are
independently testable.

- `src/lib/curriculum.ts` — **pure**. Given the module config
  (`src/content/modules.ts`) + all lesson entries, produces: the ordered module→lesson tree; a flattened ordered
  lesson sequence; and `adjacent(slug)` → `{ prev, next }` spanning module
  boundaries. The existing `src/lib/navigation.ts` logic folds into this
  module (and `navigation.ts` is removed; its tests migrate).
- `src/lib/progress/ProgressStore.ts` — interface:
  `isComplete(slug): boolean`, `setComplete(slug, value): void`,
  `lastVisited(): string | null`, `setLastVisited(slug): void`,
  `all(): Record<string, boolean>`.
- `src/lib/progress/LocalStorageProgressStore.ts` — implements the
  interface over `localStorage`; guards absent/disabled/corrupt storage
  with an in-memory fallback; never throws into the UI.
- `src/lib/progress/useProgress.ts(x)` — React context/hook exposing the
  store to islands; the concrete store is injected so A can swap it.
- `src/components/Syllabus.astro` — `/learn` overview: modules in order,
  lessons with type label + `estMinutes` + completion tick; a "Continue
  where you left off" control driven by `lastVisited()` / first incomplete.
- `src/components/Sidebar.astro` — rebuilt: lessons grouped by module,
  completion marks, `aria-current="page"` on the active lesson, labelled
  nav landmark (consistent with existing a11y standard).
- `src/layouts/LessonLayout.astro` — replaces `TutorialLayout.astro`.
  Renders by `type`: `reading` = prose; `interactive` = prose + the MDX
  body (PyRunner usage unchanged); `quiz` = accessible stub component.
  Includes a **Mark complete** control (a small React island writing via
  `useProgress`) and cross-module prev/next.
- `src/components/QuizStub.tsx` — accessible "Quiz coming soon" island
  (placeholder for subsystem C).
- `src/pages/learn/[...slug].astro` — lesson route; `getStaticPaths` over
  the `lessons` collection; typed props (inferred from `getStaticPaths`,
  the pattern already used).
- `src/pages/learn/index.astro` — renders `Syllabus`.

## Data flow

- **Build:** module config + lesson MDX → Zod + integrity check → typed
  curriculum. Invalid metadata fails the build.
- **Render (static):** `curriculum.ts` derives the tree/sequence → Syllabus,
  Sidebar, LessonLayout, prev/next links.
- **Runtime (client islands):** `useProgress` reads/writes
  `LocalStorageProgressStore`; completion + last-visited drive ticks, the
  Syllabus continue control, and Sidebar marks. No data leaves the browser
  in this slice.

## Error handling

- Build-time: integrity check throws precise errors (offending
  lesson/module named) → fails `astro build` / `astro check`.
- `LocalStorageProgressStore`: try/catch around all storage access;
  corrupt JSON or disabled storage → in-memory fallback; UI never sees a
  throw.
- Unknown/unsupported lesson `type` at render: explicit "unsupported lesson
  type" block, not a crash (defense even though Zod constrains it).
- Quiz stub: explicit, accessible placeholder — never a broken/blank page.

## Testing (honors the mandatory e2e Definition of Done)

- **Unit (Vitest, TDD):**
  - `curriculum.ts`: tree assembly, flattened sequence order, `adjacent`
    across module boundaries, first/last lesson, single-lesson module,
    empty/edge inputs, unknown slug.
  - `LocalStorageProgressStore`: set/get/complete round-trip, lastVisited,
    corrupt-JSON recovery, storage-disabled fallback.
- **Type/build:** `npm run typecheck` (`astro check`) 0/0/0; build
  integrity check passes on valid content and fails on seeded invalid
  content (verified during implementation, not committed broken).
- **e2e (Playwright, headless):**
  - `/learn` renders modules in order with their lessons.
  - Navigate across a module boundary using prev/next.
  - Mark a lesson complete → completion tick persists after reload
    (localStorage).
  - Interactive lesson still loads Pyodide and runs the sample Python
    (regression guard on PyRunner) — asserts real output.
  - Quiz-stub lesson renders the accessible placeholder.

## Out of scope (YAGNI / other subsystems)

Real accounts/auth/sync and cross-device progress (A); quiz engine,
grading, projects, certificates (C); real LLM/BYO-key execution (D); the
full authored curriculum beyond the migrated sample + a thin proving
skeleton (E); search, tracks/specializations, multi-language content.
