# UI Redesign v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Agentic Learning Book a cohesive modern developer-tool look (token-driven design system, self-hosted Inter/JetBrains Mono, indigo→violet accent on slate, real hierarchy, module cards, visible progress) without changing any DOM/role/heading/accessible-name/text/behavior.

**Architecture:** A Tailwind v4 `@theme` token layer + shared component classes in `src/styles/global.css` is the single source of truth; every `.astro`/`.tsx` view is restyled by editing **only** `class`/`className` attribute values and adding purely presentational wrapper `<div>`s. Self-hosted `@fontsource` fonts are devDependencies bundled into the static build.

**Tech Stack:** Astro 6 (static), React 19 islands, Tailwind v4 (`@tailwindcss/vite` + `@tailwindcss/typography`), `@fontsource/inter`, `@fontsource/jetbrains-mono`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-17-ui-redesign-design.md`

---

## THE HARD INVARIANT (applies to every task)

This is a **visual-only** change. In every task you may edit ONLY:
- the **value** of `class` / `className` attributes,
- `src/styles/global.css`,
- and add **purely presentational wrapper elements** (`<div>`/`<span>` with only layout/style classes, no role, no text content of their own).

You may **NOT** add/remove/rename/reorder semantic elements; change tag names; change or move any **visible text**, heading levels, `role`, `aria-*`, `href`, `name`, `id`, `type`, label association, `client:*` directive, or any JS/TS logic, props, state, content (`.mdx`), schema, or config.

Locators the e2e depends on and that MUST remain valid: `h1` "Learn to build AI agents"; link text "Start the curriculum"; `getByRole("link", { name: /Start the curriculum/i })` → `href="/learn"`; module `h2` headings (e.g. "Foundations"); lesson links by title; "The Agent Loop →" / prev-next link text; buttons named `/Mark complete/i` and `/Completed/i`; the quiz radios' accessible names (option text), `getByRole("status")`, `getByRole("note")` "coming soon", `getByRole("button",{name:"Submit"})`; the interactive Run button name `/Run|Loading|Running/i` and `pre[aria-live='polite']`; the model-settings radios `/Mock \(default/i` & `/Real \(your key/i`, `getByLabel("API key")` with `type=password`; the `/tutorials/...`→`/learn/...` redirect.

**Per-task verification gate (the "tests"):** there are no new unit tests — the existing suite + the build + the **mandatory e2e** are the regression gate proving the invariant held. Every task runs `npx astro check` (0/0/0) and `npm run build` (green, 51 pages); every task that restyles rendered UI also runs the authoritative networked e2e and re-screenshots.

Networked e2e command (the Pyodide anchor needs `cdn.jsdelivr.net`; the runner sandbox blocks network, so the executor must run this with the Bash tool's `dangerouslyDisableSandbox: true`):
```
CI=1 npx playwright test --reporter=list
```
Expected every time: **10 passed**. If only the `interactive lesson runs Python in-browser` test fails with a network/CDN/timeout to `cdn.jsdelivr.net`, retry once; if still only that and only environmental, that is acceptable for that run (report it honestly) — any **assertion/locator** failure means the restyle broke the invariant and must be fixed, never worked around by editing the test.

Screenshot helper (used by several tasks). Create it once in Task 1 and reuse:

`scripts/shots.mjs`
```js
import { chromium } from "@playwright/test";
const base = process.env.BASE || "http://localhost:4321";
const tag = process.env.TAG || "after";
const b = await chromium.launch();
const pages = [
  ["/", "landing", 1280, 900],
  ["/learn", "syllabus", 1280, 1100],
  ["/learn/01-what-is-an-agent", "lesson", 1280, 1100],
  ["/learn/05-foundations-check", "quiz", 1280, 1100],
  ["/learn", "syllabus-mobile", 390, 900],
];
for (const [url, name, w, h] of pages) {
  for (const dark of [false, true]) {
    const p = await b.newPage({ colorScheme: dark ? "dark" : "light" });
    await p.setViewportSize({ width: w, height: h });
    await p.goto(base + url, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    await p.screenshot({
      path: `/tmp/ui-${tag}-${name}-${dark ? "dark" : "light"}.png`,
      fullPage: true,
    });
    await p.close();
  }
}
await b.close();
console.log("screenshots written to /tmp/ui-" + tag + "-*");
```
Run pattern (build first; preview serves `dist/`):
```
npm run build && (npm run preview >/tmp/prev.log 2>&1 &) && sleep 4 && TAG=<tag> node scripts/shots.mjs && pkill -f "astro preview" || true
```
(`node scripts/shots.mjs` must run from the repo root so `@playwright/test` resolves; run it with `dangerouslyDisableSandbox: true`.)

---

### Task 0: Branch + baseline screenshots

**Files:** none (branch exists); writes `scripts/shots.mjs`.

- [ ] **Step 1: Confirm branch**

Run: `git rev-parse --abbrev-ref HEAD`
Expected: `ui-redesign-v1`. If not, `git checkout ui-redesign-v1`. Never implement on `main`.

- [ ] **Step 2: Create `scripts/shots.mjs`**

Create the file with exactly the screenshot-helper content from the section above.

- [ ] **Step 3: Capture BEFORE screenshots**

Run (with `dangerouslyDisableSandbox: true`):
```
npm run build && (npm run preview >/tmp/prev.log 2>&1 &) && sleep 4 && TAG=before node scripts/shots.mjs && pkill -f "astro preview" || true
```
Expected: `/tmp/ui-before-*-{light,dark}.png` written (10 files). These are the before/after baseline.

- [ ] **Step 4: Commit**
```bash
git add scripts/shots.mjs
git commit -m "chore(ui): screenshot harness + baseline capture"
```

---

### Task 1: Design-token foundation (global.css + fonts + favicon)

**Files:**
- Modify: `package.json` (add devDependencies)
- Modify: `src/styles/global.css`
- Create: `public/favicon.svg`
- Modify: `src/layouts/BaseLayout.astro` (head: favicon + lang; body: token bg/text classes only)

- [ ] **Step 1: Add font devDependencies**

Run:
```
npm install -D @fontsource/inter@5 @fontsource/jetbrains-mono@5
```
Expected: both appear under `devDependencies` in `package.json`; `package-lock.json` updated. (Build-time assets only — no runtime/dependencies entry.)

- [ ] **Step 2: Replace `src/styles/global.css` ENTIRELY with:**

```css
@import "tailwindcss";

/* Self-hosted fonts (bundled into the static build, no external requests). */
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

@plugin "@tailwindcss/typography";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
    sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo,
    monospace;

  --color-accent-50: #eef2ff;
  --color-accent-100: #e0e7ff;
  --color-accent-200: #c7d2fe;
  --color-accent-300: #a5b4fc;
  --color-accent-400: #818cf8;
  --color-accent-500: #6366f1;
  --color-accent-600: #5b50e6;
  --color-accent-700: #4f46e5;
  --color-accent-800: #4338ca;
  --color-accent-900: #3730a3;
  --color-accent-950: #1e1b4b;

  --radius-md: 0.5rem;
  --radius-lg: 0.875rem;

  --shadow-soft: 0 1px 2px rgb(15 23 42 / 0.04),
    0 2px 8px rgb(15 23 42 / 0.06);
  --shadow-raise: 0 4px 16px rgb(15 23 42 / 0.10);
}

:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Shared component classes — keep restyle DRY and consistent. */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)]
      px-4 py-2 text-sm font-semibold transition-colors
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-accent-500 focus-visible:ring-offset-2
      focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950
      disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn bg-accent-600 text-white hover:bg-accent-700
      shadow-[var(--shadow-soft)];
  }
  .btn-secondary {
    @apply btn border border-slate-300 text-slate-800 hover:bg-slate-100
      dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800;
  }
  .card {
    @apply rounded-[var(--radius-lg)] border border-slate-200 bg-white
      shadow-[var(--shadow-soft)] dark:border-slate-800 dark:bg-slate-900;
  }
  .badge {
    @apply inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5
      text-[0.7rem] font-medium uppercase tracking-wide text-slate-600
      dark:bg-slate-800 dark:text-slate-300;
  }
  .progress {
    @apply h-2 w-full overflow-hidden rounded-full bg-slate-200
      dark:bg-slate-800;
  }
  .progress > span {
    @apply block h-full rounded-full bg-accent-600 transition-[width];
  }
  .link-accent {
    @apply text-accent-700 hover:text-accent-800 dark:text-accent-300
      dark:hover:text-accent-200;
  }
}
```

- [ ] **Step 3: Create `public/favicon.svg`:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#4f46e5"/>
  <path d="M8 21.5 14 10h2.2l6 11.5h-2.4l-1.5-3h-6.4l-1.5 3H8Zm4.7-5h4.6L15 12.3 12.7 16.5Z" fill="#fff"/>
</svg>
```

- [ ] **Step 4: Update `src/layouts/BaseLayout.astro` — head + body classes only**

In `<html>` keep `lang="en"`. Inside `<head>`, after the `<title>` line, add:
```astro
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
Change the `<body>` class value from
`class="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"`
to
`class="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100"`.
Change the `<main>` class value from
`class="mx-auto max-w-5xl px-4 py-8"`
to
`class="mx-auto max-w-5xl px-4 py-10"`.
**No other edits** (no structural/text/role changes).

- [ ] **Step 5: Typecheck + build**

Run: `npx astro check && npm run build`
Expected: 0/0/0; build green, 51 pages; no CSS errors; fonts emitted under `dist/_astro/` (the `@fontsource` `@import`s resolve).

- [ ] **Step 6: e2e regression + screenshots**

Run the networked e2e (sandbox disabled): `CI=1 npx playwright test --reporter=list` → **10 passed**.
Then: `npm run build && (npm run preview >/tmp/prev.log 2>&1 &) && sleep 4 && TAG=t1 node scripts/shots.mjs && pkill -f "astro preview" || true` (sandbox disabled). Eyeball `/tmp/ui-t1-*`: Inter is applied, accent available, nothing broke.

- [ ] **Step 7: Commit**
```bash
git add package.json package-lock.json src/styles/global.css public/favicon.svg src/layouts/BaseLayout.astro
git commit -m "feat(ui): design-token foundation — theme, fonts, favicon"
```

---

### Task 2: Global chrome — Header + footer

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/layouts/BaseLayout.astro` (add a presentational footer only)

- [ ] **Step 1: Restyle `Header.astro` (class values only; keep both links, text, `aria-current`, hrefs)**

Set the `<header>` class to:
`"sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-800 dark:bg-slate-950/85"`
Add a thin accent bar as the first child of `<header>` (presentational, no text/role):
```astro
  <div class="h-0.5 w-full bg-accent-600"></div>
```
Set the `<nav>` class to:
`"mx-auto flex max-w-5xl items-center justify-between px-4 py-3"`
Set the brand `<a>` (text "Agentic Learning" unchanged) class to:
`"text-base font-bold tracking-tight text-slate-900 dark:text-slate-100"`
Set the "Curriculum" `<a>` (text + `aria-current` unchanged) class to:
`"rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-[current=page]:bg-accent-50 aria-[current=page]:text-accent-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:aria-[current=page]:bg-accent-950 dark:aria-[current=page]:text-accent-200"`

- [ ] **Step 2: Add a presentational footer in `BaseLayout.astro`**

Immediately AFTER the `</main>` close tag and BEFORE `</body>`, add (purely presentational; the only new text is a generic site footer line, which no test asserts):
```astro
    <footer class="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500 dark:text-slate-500">
      <div class="border-t border-slate-200 pt-6 dark:border-slate-800">
        Agentic Learning — learn to build AI agents, one runnable lesson at a time.
      </div>
    </footer>
```

- [ ] **Step 2b: Confirm no test asserts footer-absence**

Run: `grep -n "footer\|contentinfo" e2e/site.spec.ts`
Expected: no matches (the new `<footer>` cannot break a locator). If any match exists, stop and report.

- [ ] **Step 3: Typecheck + build**

Run: `npx astro check && npm run build`
Expected: 0/0/0; green, 51 pages.

- [ ] **Step 4: e2e + screenshots**

`CI=1 npx playwright test --reporter=list` → 10 passed (esp. landing "renders and links to the curriculum" — header link intact).
Screenshots: `... TAG=t2 node scripts/shots.mjs ...`. Verify sticky header + accent bar + footer, light & dark.

- [ ] **Step 5: Commit**
```bash
git add src/components/Header.astro src/layouts/BaseLayout.astro
git commit -m "feat(ui): sticky themed header, accent bar, footer"
```

---

### Task 3: Landing page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Restyle, preserving the `h1` text, the CTA link text, and its `href="/learn"`**

Keep the `<section>`, `<h1>` ("Learn to build AI agents"), `<p>` subhead text, and the CTA `<a href="/learn">` with text "Start the curriculum &rarr;" exactly. Apply:
- `<section>` class → `"mx-auto max-w-3xl py-20 text-center sm:py-28"`
- `<h1>` class → `"text-balance text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white"`
- subhead `<p>` class → `"mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400"`
- CTA `<a>` class → `"btn-primary mt-9 px-6 py-3 text-base"`

Then, immediately AFTER the CTA `<a>` and still inside `<section>`, add this presentational feature row (new generic text; no test asserts these strings — verified in Step 2):
```astro
    <ul class="mx-auto mt-16 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
      <li class="card p-5">
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Read</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Concise, practical lessons from engineer to AI engineer.</p>
      </li>
      <li class="card p-5">
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Run real code</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Edit and execute agent code in your browser — no setup.</p>
      </li>
      <li class="card p-5">
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Check yourself</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Module quizzes and tracked progress as you go.</p>
      </li>
    </ul>
```

- [ ] **Step 2: Confirm the new copy collides with no locator**

Run: `grep -nE "Read|Run real code|Check yourself" e2e/site.spec.ts`
Expected: no matches. (The landing e2e asserts only the `h1` and the "Start the curriculum" link → still present.) If any match, stop and report.

- [ ] **Step 3: Typecheck + build**

Run: `npx astro check && npm run build` → 0/0/0; green, 51 pages.

- [ ] **Step 4: e2e + screenshots**

`CI=1 npx playwright test --reporter=list` → 10 passed (landing test in particular).
`... TAG=t3 node scripts/shots.mjs ...`; verify the hero + feature row look right, light & dark, desktop & mobile.

- [ ] **Step 5: Commit**
```bash
git add src/pages/index.astro
git commit -m "feat(ui): restyle landing — hero + feature row"
```

---

### Task 4: Syllabus — module cards + progress

**Files:**
- Modify: `src/pages/learn/index.astro`
- Modify: `src/components/SyllabusView.tsx`

- [ ] **Step 1: `src/pages/learn/index.astro` heading class only**

Keep the `<h1>` text "Agentic AI Curriculum". Set its class to:
`"mb-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"`
Add (presentational, no asserted text) directly under the `<h1>`:
```astro
  <p class="mb-8 text-slate-600 dark:text-slate-400">A linear, job-ready path — modules of short lessons, interactive code, and checks.</p>
```
Run `grep -n "job-ready path" e2e/site.spec.ts` → expect no match.

- [ ] **Step 2: Restyle `SyllabusView.tsx` — className values + presentational wrappers ONLY**

Do NOT change any logic, `href`, the `✓`/`○` glyphs, the `sr-only" (completed)"` text, the "Continue where you left off →" text, module `<h2>` text, lesson title text, or the `{l.type} · {l.estMinutes} min` text. Apply exactly:

- Root wrapper `<div>` → add a presentational progress header as its FIRST child (computed from existing data already in scope — add this `const` next to the existing `continueSlug` computation, it is derived display state, not behavior change):
  ```tsx
  const total = curriculum.sequence.length;
  const doneCount = curriculum.sequence.filter((l) => isComplete(l.slug)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  ```
  First child of the root `<div>`:
  ```tsx
  <div className="card mb-8 p-5">
    <div className="mb-2 flex items-center justify-between text-sm font-medium">
      <span className="text-slate-700 dark:text-slate-300">Your progress</span>
      <span className="text-slate-500">{doneCount} of {total} complete</span>
    </div>
    <div className="progress"><span style={{ width: `${pct}%` }} /></div>
  </div>
  ```
- The "Continue where you left off" `<a>` className → `"btn-primary mb-10"`.
- Each module `<section>` className → `"card mb-6 p-6"`.
- Module `<h2>` className → `"text-xl font-bold tracking-tight text-slate-900 dark:text-white"`.
- Module summary `<p>` className → `"mt-1 text-sm text-slate-600 dark:text-slate-400"`.
- Immediately AFTER the module summary `<p>` and BEFORE the `<ul>`, add this per-module progress bar (display value derived from the already-in-scope `m.lessons` + `isComplete`; not behavior). Inside the `curriculum.modules.map((m) => ...)` body, before the returned JSX, compute:
  ```tsx
  const mDone = m.lessons.filter((l) => isComplete(l.slug)).length;
  const mPct = m.lessons.length ? Math.round((mDone / m.lessons.length) * 100) : 0;
  ```
  and render:
  ```tsx
  <div className="mt-3 flex items-center gap-3">
    <div className="progress max-w-xs"><span style={{ width: `${mPct}%` }} /></div>
    <span className="text-xs text-slate-500">{mDone}/{m.lessons.length}</span>
  </div>
  ```
- `<ul>` className → `"mt-5 divide-y divide-slate-100 dark:divide-slate-800"`.
- Lesson `<li>`: leave as is; set the inner `<a>` className to
  `"group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"`.
- The completion glyph `<span aria-hidden="true">` className →
  `(done ? "text-accent-600" : "text-slate-300 dark:text-slate-600")` (keep the `{done ? "✓" : "○"}` content).
- The title `<span className="font-medium">` → `"font-medium text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white"`.
- The meta `<span>` (type · min) → `"badge ml-auto"`.

- [ ] **Step 3: Typecheck + build**

Run: `npx astro check && npm run build` → 0/0/0; green, 51 pages.

- [ ] **Step 4: e2e + screenshots**

`CI=1 npx playwright test --reporter=list` → 10 passed (esp. "syllabus shows the Foundations module and its lessons" — `getByRole("heading",{name:"Foundations"})` and lesson links must still resolve).
`... TAG=t4 node scripts/shots.mjs ...`; verify module cards + progress bar, light & dark, incl. mobile.

- [ ] **Step 5: Commit**
```bash
git add src/pages/learn/index.astro src/components/SyllabusView.tsx
git commit -m "feat(ui): syllabus module cards + progress visualization"
```

---

### Task 5: Lesson layout — sidebar, prose, prev/next, MarkComplete

**Files:**
- Modify: `src/layouts/LessonLayout.astro`
- Modify: `src/components/SidebarNav.tsx`
- Modify: `src/components/MarkComplete.tsx`

- [ ] **Step 1: `LessonLayout.astro` — class values + presentational wrappers only**

Preserve every element, the `{lesson.type}` branch logic, `<h1>`, the `<slot/>`, `<Quiz/>`, `<MarkComplete/>`, the prev/next `<nav aria-label="Lesson navigation">` and its link `href`s/text (`← {prev.title}` / `{next.title} →`). Apply:
- Outer grid `<div>` class → `"grid grid-cols-1 gap-10 md:grid-cols-[17rem_1fr]"`.
- `<aside>` class → `"md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:border-r md:border-slate-200 md:pr-5 md:dark:border-slate-800"`.
- `<article>` class → `"prose prose-slate max-w-none dark:prose-invert prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:font-mono prose-headings:tracking-tight prose-a:text-accent-700 dark:prose-a:text-accent-300"`.
- The `{lesson.type} · {lesson.estMinutes} min` `<p>` class → `"badge"` (keep text).
- The prev/next `<nav>` class → `"mt-14 flex justify-between gap-4 border-t border-slate-200 pt-6 text-sm dark:border-slate-800"`.
- Each prev/next `<a>` (keep text): class → `"card link-accent px-4 py-3 font-medium no-underline hover:shadow-[var(--shadow-raise)]"`. Keep the empty `<span />` placeholders.
- The `<div class="mt-8 not-prose">` around MarkComplete → `"mt-10 not-prose"`.

- [ ] **Step 2: `SidebarNav.tsx` — className values only (no logic/text/aria/href changes)**

- `<nav aria-label="Curriculum">` className → `"text-sm"` (unchanged; keep).
- module wrapper `<div className="mb-4">` → `"mb-5"`.
- module label `<p>` → `"mb-2 px-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"`.
- `<ul>` → `"space-y-0.5"`.
- the lesson `<a>` `className` ternary → active:
  `"flex rounded-[var(--radius-md)] bg-accent-50 px-2 py-1.5 font-semibold text-accent-700 dark:bg-accent-950 dark:text-accent-200"`
  inactive:
  `"flex rounded-[var(--radius-md)] px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"`
  (keep `aria-current`, the `✓ `/`○ ` `aria-hidden` glyph, the title, and the `sr-only" (completed)"`).

- [ ] **Step 3: `MarkComplete.tsx` — className values only**

Keep `type="button"`, `aria-pressed`, the onClick, and the exact children (`✓ Completed` / `Mark complete`). Replace the className ternary with:
- done → `"btn-primary bg-emerald-600 hover:bg-emerald-700"`
- not done → `"btn-secondary"`

- [ ] **Step 4: Typecheck + build**

Run: `npx astro check && npm run build` → 0/0/0; green, 51 pages.

- [ ] **Step 5: e2e + screenshots**

`CI=1 npx playwright test --reporter=list` → 10 passed (esp. "prev/next navigates between lessons" — active sidebar link still `aria-current="page"` with the right `href`; "mark complete persists across reload" — button names `/Mark complete/i`,`/Completed/i` intact).
`... TAG=t5 node scripts/shots.mjs ...`; verify sidebar current state, prose, prev/next cards, light & dark.

- [ ] **Step 6: Commit**
```bash
git add src/layouts/LessonLayout.astro src/components/SidebarNav.tsx src/components/MarkComplete.tsx
git commit -m "feat(ui): lesson sidebar, prose, prev/next, mark-complete restyle"
```

---

### Task 6: Interactive & quiz component surfaces

**Files:**
- Modify: `src/components/PyRunner.tsx`
- Modify: `src/components/PolicyRunner.tsx`
- Modify: `src/components/ModelSettings.tsx`
- Modify: `src/components/Quiz.tsx`

**Rule for this whole task:** edit ONLY `className` string values. Do NOT touch any `role`, `aria-live`, `aria-label`, `name=`, `type=`, button text, the `<pre>` element/its `aria-live="polite"`, radio grouping, state, or logic. Read each file, change classes to use the token system, keep structure identical.

- [ ] **Step 1: `PyRunner.tsx` / `PolicyRunner.tsx` (identical DOM patterns)**

- Outer container `<div>` → `"card my-6 overflow-hidden not-prose"`.
- The code `<textarea>` → `"w-full resize-y border-0 bg-slate-900 p-4 font-mono text-sm text-slate-100 focus:outline-none"` (keep `aria-label`, `spellCheck`, rows, value/onChange).
- The toolbar row `<div>` → `"flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60"`.
- The Run `<button>` → `"btn-primary"` (keep the dynamic `Run`/`Loading Python…`/`Running…` text and `disabled`).
- The error `<span>` (if present) → `"text-sm font-medium text-red-600 dark:text-red-400"` (keep text).
- The output `<pre aria-live="polite">` → `"overflow-x-auto border-t border-slate-200 bg-slate-950 p-4 font-mono text-sm text-emerald-300 dark:border-slate-800"` (element, `aria-live`, content unchanged).
- In `PolicyRunner.tsx` keep `<ModelSettings />` exactly where it is; only its wrapper `<div>` class may become `"border-b border-slate-200 p-3 dark:border-slate-800"`.

- [ ] **Step 2: `ModelSettings.tsx` (keep the `name="alb-model-mode"` radios, `aria-label="API key"`, `type="password"`, "Forget key" text, the notice text)**

- root `<div>` → `"rounded-[var(--radius-md)] border border-slate-200 p-3 text-sm dark:border-slate-800"`.
- `<legend>` → `"font-semibold text-slate-800 dark:text-slate-200"`.
- each mode `<label>` → `"mr-4 inline-flex items-center gap-1.5"`.
- the real-mode container `<div>` → `"mt-3 space-y-2"`.
- each field label `<span>` → `"block text-xs font-medium text-slate-500 dark:text-slate-400"`.
- each text/password `<input>` → `"w-full rounded-[var(--radius-md)] border border-slate-300 bg-white p-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"`.
- "Forget key" `<button>` → `"btn-secondary px-2 py-1 text-xs"`.
- notice `<p>` → `"text-xs text-slate-500 dark:text-slate-400"`.

- [ ] **Step 3: `Quiz.tsx` (keep all roles/text: empty-state `role="note"` + "coming soon" copy, `<fieldset>/<legend>`, radio `name="alb-q-${qi}"`, `role="status" aria-live="polite"`, "✓ Correct"/"✗ Incorrect", Submit/Retry text, `setComplete` logic — className only)**

- empty-state `<div role="note">` → `"card my-6 p-6 text-center"`.
- empty-state title `<p>` → `"text-lg font-semibold text-slate-900 dark:text-slate-100"`; body `<p>` → `"mt-2 text-sm text-slate-600 dark:text-slate-400"`.
- quiz root `<div>` → `"my-6 not-prose"`.
- `<ol>` → `"space-y-5"`.
- each question `<li>` → wrap with class `"card p-5"` (set on the existing `<li>`; do not add elements).
- `<legend>` → `"text-base font-semibold text-slate-900 dark:text-slate-100"`.
- option `<label>` → `"flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"`.
- per-question result `<p>` → keep the correct/incorrect conditional, set classes to
  correct: `"mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"`
  incorrect: `"mt-2 text-sm font-medium text-red-700 dark:text-red-400"`.
- the result wrapper `<div className="mt-6">` → `"mt-6 card p-5"`.
- the score `<p role="status" aria-live="polite">` → `"text-base font-semibold text-slate-900 dark:text-slate-100"`.
- Retry `<button>` → `"btn-secondary mt-3"`.
- Submit `<button>` → `"btn-primary mt-6"` (keep `disabled={!allAnswered}`).

- [ ] **Step 4: Invariant grep**

Run:
```
grep -nE 'role=|aria-|name="alb|type="password"|aria-live|getByRole' src/components/PyRunner.tsx src/components/PolicyRunner.tsx src/components/ModelSettings.tsx src/components/Quiz.tsx | wc -l
```
Then `git diff` these four files and confirm **every** changed line is a `className=` value (or a JSX class string), with no edits to `role`, `aria*`, `name`, `type`, element tags, text, or logic. If any non-class change appears, revert it.

- [ ] **Step 5: Typecheck + build**

Run: `npx astro check && npm run build` → 0/0/0; green, 51 pages.

- [ ] **Step 6: Authoritative networked e2e + screenshots**

`CI=1 npx playwright test --reporter=list` → **10 passed**, specifically: the live-Pyodide `interactive lesson runs Python in-browser` (Run button + `pre[aria-live='polite']` output), both quiz tests (radios by option text, `role="status"` "You scored 5 / 5", `role="note"` empty state, no Submit on un-authored), both model-settings tests (`/Mock \(default/i`,`/Real \(your key/i`, `getByLabel("API key")` `type=password`, cleared on reload). Handle a CDN-only Pyodide flake per the policy at the top; any assertion failure = invariant broken, fix the classes (never the test).
`... TAG=t6 node scripts/shots.mjs ...`; verify code/quiz/model surfaces, light & dark.

- [ ] **Step 7: Commit**
```bash
git add src/components/PyRunner.tsx src/components/PolicyRunner.tsx src/components/ModelSettings.tsx src/components/Quiz.tsx
git commit -m "feat(ui): restyle code runner, model settings, and quiz surfaces"
```

---

### Task 7: Final sweep — full gates, before/after, contrast

**Files:** none (verification + screenshot delivery only).

- [ ] **Step 1: Full gate set**

Run: `npm test && npx astro check && npm run build`
Expected: unit suite unchanged green; `astro check` 0/0/0; build green, 51 pages.

- [ ] **Step 2: Authoritative networked e2e (final)**

Run (sandbox disabled): `CI=1 npx playwright test --reporter=list`
Expected: **10 passed** (handle a Pyodide-only CDN flake per the top policy; any assertion/locator failure is a release blocker — fix the offending class, never the test).

- [ ] **Step 3: AFTER screenshots + diff pairs**

Run (sandbox disabled): `npm run build && (npm run preview >/tmp/prev.log 2>&1 &) && sleep 4 && TAG=after node scripts/shots.mjs && pkill -f "astro preview" || true`
Confirm `/tmp/ui-after-*-{light,dark}.png` (10 files) plus the Task-0 `/tmp/ui-before-*` exist for side-by-side review.

- [ ] **Step 4: Contrast spot-check**

Eyeball the AFTER light+dark screenshots for the load-bearing pairs: body text on surface, muted text on surface, accent-600 button text (white on `#5b50e6`), accent link on white and on slate-950, badge text. Confirm each is comfortably legible (target WCAG AA: ≥4.5:1 body, ≥3:1 large/UI). If any pair is marginal, adjust only the relevant token in `global.css` (e.g., darken `--color-accent-700` usage for links) and re-run Steps 1–3 for that change.

- [ ] **Step 5: Deliver before/after to the user**

Surface the before/after pairs (landing, syllabus, lesson, quiz; light + dark) for visual sign-off.

- [ ] **Step 6: Commit (if Step 4 changed tokens; else skip)**
```bash
git add src/styles/global.css
git commit -m "fix(ui): contrast tuning from final review"
```

---

## Self-Review

**Spec coverage:**
- Token layer (slate + indigo→violet accent, semantic aliases, radius, shadow, fonts) → Task 1 `@theme` ✓
- Self-hosted Inter + JetBrains Mono as devDependencies, bundled → Task 1 Step 1–2 ✓
- favicon + wordmark + chrome → Task 1 (favicon), Task 2 (header/footer) ✓
- Landing restructured, `h1`/CTA preserved → Task 3 ✓
- Syllabus module cards + overall & per-module progress, "Continue" promoted → Task 4 (overall progress card, per-module progress bar inside each module card, module cards, primary "Continue" button) ✓
- Lesson sidebar grouping/current state, prose, prev/next, MarkComplete → Task 5 ✓
- Interactive/quiz surfaces within fixed DOM → Task 6 ✓
- Accessibility (focus ring token, contrast, no color-only, preserved landmarks) → `.btn` focus-visible ring (Task 1), Task 7 Step 4 contrast, invariant rule throughout ✓
- Dark mode tuned slate → every task specifies `dark:` slate classes ✓
- Constraints: no runtime deps (fonts = devDeps), no DOM/role/text/behavior change → THE HARD INVARIANT + Task 6 Step 4 grep + per-task e2e ✓
- Testing DoD: astro check/build/unit/**e2e 10/10**/screenshots/contrast → every task gate + Task 7 ✓
- Out of scope honored: no content/route/logic, no logo system/illustration, no new features ✓


**Placeholder scan:** No TBD/TODO. `global.css`, favicon, and every class string are given verbatim; component tasks specify exact class values per element with an explicit "class-only" rule and a grep guard.

**Type/consistency:** Shared classes (`.btn`,`.btn-primary`,`.btn-secondary`,`.card`,`.badge`,`.progress`,`.link-accent`) are defined once in Task 1 and referenced by that exact name everywhere after. Token names (`accent-*`, `--radius-md/lg`, `--shadow-soft/raise`, `--font-sans/mono`) are consistent across tasks. The e2e command, screenshot harness, and the 10-passed expectation are identical in every task.

No gaps.
