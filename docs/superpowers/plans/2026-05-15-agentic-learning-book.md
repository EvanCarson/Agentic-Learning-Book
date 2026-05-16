# Agentic Learning Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a static-hostable interactive Astro site that teaches agentic AI via MDX tutorials, with one sample lesson containing a working in-browser Python runner (Pyodide).

**Architecture:** Astro 6 static site. Tutorials are an MDX Content Collection validated by a typed schema at build time. Interactivity is added as React islands hydrated only where used. The Python runner is a client-side React island loading Pyodide (CPython→WASM) from CDN — no backend.

**Tech Stack:** Astro 6, `@astrojs/mdx`, `@astrojs/react`, React 19, Tailwind CSS v4 (Vite plugin), Pyodide (CDN), Vitest (unit test for nav helper), TypeScript (strict). (Plan authored against Astro 5 / React 18 APIs; Astro 6 + React 19 are what the resolver installed — the content layer / `render` APIs and the `useState`/`useRef` hooks used here are stable across those versions.)

Working directory: repo root `Agentic-Learning-Book/` (already contains `.git` and `docs/`).

---

## File Structure

```
astro.config.mjs            integrations: mdx, react; tailwind via vite
package.json                deps + scripts (dev/build/test)
tsconfig.json               strict
vitest.config.ts            unit tests for pure helpers
src/
  styles/global.css         tailwind import + base styles
  content.config.ts         tutorials collection schema (Astro 6)
  content/tutorials/
    01-what-is-an-agent.mdx  sample lesson, embeds <PyRunner>
  lib/
    navigation.ts            getAdjacentTutorials() — pure, unit-tested
  layouts/
    BaseLayout.astro         HTML shell, global css, header slot
    TutorialLayout.astro     sidebar + content + prev/next
  components/
    Header.astro
    Sidebar.astro            lesson list from collection, ordered
    PyRunner.tsx             React island: Pyodide code runner
  pages/
    index.astro              landing page
    tutorials/[...slug].astro tutorial route + getStaticPaths
tests/
  navigation.test.ts         Vitest spec for getAdjacentTutorials
README.md                    run + deploy notes
```

One responsibility per file. `navigation.ts` is the only non-trivial logic and is the TDD target; everything else is gated by `astro build` (which runs schema + TS validation) plus explicit manual verification of the in-browser Python.

---

### Task 1: Scaffold Astro into the existing repo

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/` (Astro minimal template)

- [ ] **Step 1: Scaffold Astro in a temp dir (keeps repo .git/docs intact)**

```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
npm create astro@latest .astro-tmp -- --template minimal --typescript strict --no-install --no-git --skip-houston
```

Expected: creates `.astro-tmp/` with `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`.

- [ ] **Step 2: Move scaffold into repo root, then remove temp dir**

```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
rsync -a --exclude='.git' .astro-tmp/ ./
rm -rf .astro-tmp
ls package.json astro.config.mjs tsconfig.json src/pages/index.astro
```

Expected: all four paths listed, no error.

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: completes, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 4: Verify the bare site builds**

```bash
npm run build
```

Expected: `astro build` completes, creates `dist/index.html`.

- [ ] **Step 5: Add gitignore and commit**

Create `.gitignore`:

```
node_modules/
dist/
.astro/
.astro-tmp/
```

```bash
git add -A
git commit -m "chore: scaffold Astro 5 minimal site"
```

---

### Task 2: Add React, MDX, and Tailwind integrations

> **Amendment (applied during execution):** The layouts use Tailwind Typography
> `prose` classes, but the `prose` utilities ship in `@tailwindcss/typography`,
> which `astro add tailwind` does NOT install. This was missed in the original
> plan and caught in Task 8 review. Fix applied: `npm install -D
> @tailwindcss/typography` and add `@plugin "@tailwindcss/typography";`
> immediately after `@import "tailwindcss";` in `src/styles/global.css`
> (Tailwind v4 CSS-first config; no `tailwind.config.*` needed). Verified by
> confirming `.prose` rules are emitted into the built `dist/` CSS.

**Files:**
- Modify: `astro.config.mjs`, `package.json` (via `astro add`)
- Create: `src/styles/global.css`

- [ ] **Step 1: Add integrations (auto-wires version-correct config)**

```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
npx astro add react mdx tailwind --yes
```

Expected: installs `@astrojs/react`, `@astrojs/mdx`, `@astrojs/tailwind` or `@tailwindcss/vite` + `tailwindcss`; updates `astro.config.mjs` with the integrations/Vite plugin.

- [ ] **Step 2: Create the global stylesheet**

Create `src/styles/global.css`:

```css
@import "tailwindcss";

:root { color-scheme: light dark; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.6;
}
```

- [ ] **Step 3: Verify build still passes with integrations**

```bash
npm run build
```

Expected: build succeeds (no MDX/React/Tailwind config errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add react, mdx, tailwind integrations"
```

---

### Task 3: Add Vitest for unit testing

> **Amendment (applied during execution):** The plan relied on `astro build`
> as the type gate, but the Astro build is esbuild-transpile-only and does
> NOT type-check. A real gate was added: `npm install -D @astrojs/check
> typescript` plus a `"typecheck": "astro check"` script. Running it across
> the whole codebase reported 0 errors / 0 warnings / 0 hints (after the
> Task 4 zod amendment below). `astro check` is the authoritative type gate
> for this project; `npm run build` alone is insufficient.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (test script)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add a test script to `package.json`**

In the `"scripts"` object add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Verify Vitest runs (no tests yet is OK)**

```bash
npx vitest run --passWithNoTests
```

Expected: exits 0, "No test files found" (acceptable).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add vitest config and test script"
```

---

### Task 4: Define the tutorials content collection schema

> **Amendment (applied during execution):** Importing `z` from
> `astro:content` is deprecated in Astro 6 (`ts(6385)`, surfaced by the
> `astro check` gate). Final form imports `defineCollection` from
> `astro:content` and `z` from `zod` directly, with `zod` added as a regular
> dependency. Schema/loader/export are otherwise unchanged.

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/tutorials/.gitkeep`

- [ ] **Step 1: Create `src/content.config.ts` (Astro 6 content layer)**

```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().nonnegative(),
    summary: z.string(),
  }),
});

export const collections = { tutorials };
```

- [ ] **Step 2: Keep the empty content dir tracked**

```bash
mkdir -p src/content/tutorials
touch src/content/tutorials/.gitkeep
```

- [ ] **Step 3: Verify build (empty collection is valid)**

```bash
npm run build
```

Expected: build succeeds; Astro recognizes the `tutorials` collection.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add tutorials content collection schema"
```

---

### Task 5: Tutorial navigation helper (TDD)

This is the only non-trivial pure logic: given tutorials sorted by `order`, return the previous and next entry for the current slug. Test-first.

**Files:**
- Create: `tests/navigation.test.ts`
- Create: `src/lib/navigation.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/navigation.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getAdjacentTutorials, type NavEntry } from "../src/lib/navigation";

const entries: NavEntry[] = [
  { slug: "a", title: "A", order: 1 },
  { slug: "b", title: "B", order: 2 },
  { slug: "c", title: "C", order: 3 },
];

describe("getAdjacentTutorials", () => {
  it("returns null prev and the next for the first entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "a");
    expect(prev).toBeNull();
    expect(next?.slug).toBe("b");
  });

  it("returns surrounding entries for a middle entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "b");
    expect(prev?.slug).toBe("a");
    expect(next?.slug).toBe("c");
  });

  it("returns null next for the last entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "c");
    expect(prev?.slug).toBe("b");
    expect(next).toBeNull();
  });

  it("sorts unsorted input by order before computing neighbors", () => {
    const shuffled = [entries[2], entries[0], entries[1]];
    const { prev, next } = getAdjacentTutorials(shuffled, "b");
    expect(prev?.slug).toBe("a");
    expect(next?.slug).toBe("c");
  });

  it("returns both null when slug is not found", () => {
    const { prev, next } = getAdjacentTutorials(entries, "missing");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/navigation.test.ts
```

Expected: FAIL — cannot resolve `../src/lib/navigation`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/navigation.ts`:

```typescript
export interface NavEntry {
  slug: string;
  title: string;
  order: number;
}

export interface AdjacentTutorials {
  prev: NavEntry | null;
  next: NavEntry | null;
}

export function getAdjacentTutorials(
  entries: NavEntry[],
  currentSlug: string,
): AdjacentTutorials {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((e) => e.slug === currentSlug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? sorted[i - 1] : null,
    next: i < sorted.length - 1 ? sorted[i + 1] : null,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/navigation.test.ts
```

Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tutorial navigation helper with tests"
```

---

### Task 6: BaseLayout and Header

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
---
<header class="border-b border-gray-200 dark:border-gray-800">
  <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
    <a href="/" class="font-semibold">Agentic Learning</a>
    <a href="/tutorials/01-what-is-an-agent" class="text-sm underline">
      Start learning
    </a>
  </nav>
</header>
```

- [ ] **Step 2: Create `src/layouts/BaseLayout.astro`**

```astro
---
import "../styles/global.css";
import Header from "../components/Header.astro";

interface Props { title: string }
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <Header />
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add BaseLayout and Header"
```

---

### Task 7: Sidebar component

**Files:**
- Create: `src/components/Sidebar.astro`

- [ ] **Step 1: Create `src/components/Sidebar.astro`**

```astro
---
import { getCollection } from "astro:content";

interface Props { currentSlug?: string }
const { currentSlug } = Astro.props;

const tutorials = (await getCollection("tutorials")).sort(
  (a, b) => a.data.order - b.data.order,
);
---
<nav aria-label="Tutorials" class="text-sm">
  <p class="mb-2 font-semibold uppercase tracking-wide text-gray-500">
    Tutorials
  </p>
  <ul class="space-y-1">
    {tutorials.map((t) => (
      <li>
        <a
          href={`/tutorials/${t.id}`}
          class={
            t.id === currentSlug
              ? "font-semibold text-blue-600"
              : "text-gray-700 hover:underline dark:text-gray-300"
          }
        >
          {t.data.title}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 2: Verify build (no tutorials yet → empty list, still valid)**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Sidebar generated from tutorials collection"
```

---

### Task 8: TutorialLayout

**Files:**
- Create: `src/layouts/TutorialLayout.astro`

- [ ] **Step 1: Create `src/layouts/TutorialLayout.astro`**

```astro
---
import BaseLayout from "./BaseLayout.astro";
import Sidebar from "../components/Sidebar.astro";
import type { NavEntry } from "../lib/navigation";

interface Props {
  title: string;
  slug: string;
  prev: NavEntry | null;
  next: NavEntry | null;
}
const { title, slug, prev, next } = Astro.props;
---
<BaseLayout title={title}>
  <div class="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr]">
    <aside class="md:border-r md:border-gray-200 md:pr-4 md:dark:border-gray-800">
      <Sidebar currentSlug={slug} />
    </aside>
    <article class="prose max-w-none dark:prose-invert">
      <h1>{title}</h1>
      <slot />
      <nav class="mt-12 flex justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
        {prev ? (
          <a href={`/tutorials/${prev.slug}`}>&larr; {prev.title}</a>
        ) : <span />}
        {next ? (
          <a href={`/tutorials/${next.slug}`}>{next.title} &rarr;</a>
        ) : <span />}
      </nav>
    </article>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add TutorialLayout with sidebar and prev/next nav"
```

---

### Task 9: Landing page

**Files:**
- Modify: `src/pages/index.astro` (replace scaffold default)

- [ ] **Step 1: Replace `src/pages/index.astro` entirely**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Agentic Learning">
  <section class="py-12 text-center">
    <h1 class="text-4xl font-bold">Learn to build AI agents</h1>
    <p class="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
      One interactive lesson at a time. Read, edit, and run real agent
      code in your browser.
    </p>
    <a
      href="/tutorials/01-what-is-an-agent"
      class="mt-8 inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
    >
      Begin: What Is an Agent &rarr;
    </a>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds; `dist/index.html` contains "Learn to build AI agents".

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add landing page"
```

---

### Task 10: Tutorial route with prev/next

**Files:**
- Create: `src/pages/tutorials/[...slug].astro`

- [ ] **Step 1: Create `src/pages/tutorials/[...slug].astro`**

```astro
---
import { getCollection, render } from "astro:content";
import TutorialLayout from "../../layouts/TutorialLayout.astro";
import { getAdjacentTutorials, type NavEntry } from "../../lib/navigation";

export async function getStaticPaths() {
  const tutorials = await getCollection("tutorials");
  const navEntries: NavEntry[] = tutorials.map((t) => ({
    slug: t.id,
    title: t.data.title,
    order: t.data.order,
  }));
  return tutorials.map((entry) => {
    const { prev, next } = getAdjacentTutorials(navEntries, entry.id);
    return {
      params: { slug: entry.id },
      props: { entry, prev, next },
    };
  });
}

const { entry, prev, next } = Astro.props;
const { Content } = await render(entry);
---
<TutorialLayout
  title={entry.data.title}
  slug={entry.id}
  prev={prev}
  next={next}
>
  <Content />
</TutorialLayout>
```

- [ ] **Step 2: Verify build (no tutorials yet → 0 routes, still valid)**

```bash
npm run build
```

Expected: build succeeds with no `/tutorials/*` pages yet.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add tutorial route with prev/next navigation"
```

---

### Task 11: PyRunner React island (Pyodide)

A client-side React island. Loads the Pyodide runtime from CDN on first Run, executes user-edited Python in-browser, captures stdout/stderr, renders distinct loading / running / error states. Pinned Pyodide version: `0.27.2` (stable as of this plan).

**Files:**
- Create: `src/components/PyRunner.tsx`

- [ ] **Step 1: Create `src/components/PyRunner.tsx`**

```tsx
import { useRef, useState } from "react";

const PYODIDE_VERSION = "0.27.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

type Status = "idle" | "loading" | "running" | "ready" | "error";

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function PyRunner({ code }: { code: string }) {
  const [source, setSource] = useState(code);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const pyodideRef = useRef<any>(null);

  async function getPyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    setStatus("loading");
    await loadScript(`${PYODIDE_CDN}/pyodide.js`);
    if (!window.loadPyodide) throw new Error("Pyodide failed to initialize");
    pyodideRef.current = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    return pyodideRef.current;
  }

  async function run() {
    setOutput("");
    try {
      const pyodide = await getPyodide();
      setStatus("running");
      let captured = "";
      pyodide.setStdout({ batched: (s: string) => (captured += s + "\n") });
      pyodide.setStderr({ batched: (s: string) => (captured += s + "\n") });
      await pyodide.runPythonAsync(source);
      setOutput(captured || "(no output)");
      setStatus("ready");
    } catch (err) {
      setOutput(String(err));
      setStatus("error");
    }
  }

  const busy = status === "loading" || status === "running";

  return (
    <div className="my-6 rounded border border-gray-300 dark:border-gray-700">
      <textarea
        className="w-full resize-y bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900"
        rows={Math.max(4, source.split("\n").length)}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
      />
      <div className="flex items-center gap-3 border-t border-gray-300 p-2 dark:border-gray-700">
        <button
          onClick={run}
          disabled={busy}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {status === "loading"
            ? "Loading Python…"
            : status === "running"
              ? "Running…"
              : "Run"}
        </button>
        {status === "error" && (
          <span className="text-sm text-red-600">Error — see output</span>
        )}
      </div>
      {output && (
        <pre className="overflow-x-auto border-t border-gray-300 bg-black p-3 text-sm text-green-400 dark:border-gray-700">
{output}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build (component compiles, unused until imported)**

```bash
npm run build
```

Expected: build succeeds (TypeScript/React compile clean).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add PyRunner Pyodide island"
```

---

### Task 12: Sample tutorial embedding PyRunner

**Files:**
- Create: `src/content/tutorials/01-what-is-an-agent.mdx`
- Delete: `src/content/tutorials/.gitkeep`

- [ ] **Step 1: Create `src/content/tutorials/01-what-is-an-agent.mdx`**

````mdx
---
title: "What Is an Agent?"
order: 1
summary: "The perceive–decide–act loop, run in your browser."
---

import PyRunner from "../../components/PyRunner.tsx";

An **agent** is a system that repeatedly *perceives* its environment,
*decides* what to do, and *acts* — then observes the result and loops again.

The simplest possible agent is just that loop. Edit the code below and
press **Run** — this executes real Python in your browser, no server.

<PyRunner client:visible code={`def decide(observation):
    # a trivial policy: search if we don't know the answer
    if "unknown" in observation:
        return "search"
    return "answer"

def agent_loop(observations):
    for obs in observations:
        action = decide(obs)
        print(f"obs={obs!r} -> action={action!r}")

agent_loop(["unknown topic", "known fact", "unknown thing"])
`} />

Next, we'll give this agent **tools** so its actions can affect the world.
````

- [ ] **Step 2: Remove the placeholder keepfile**

```bash
rm -f src/content/tutorials/.gitkeep
```

- [ ] **Step 3: Verify build produces the tutorial page**

```bash
npm run build
```

Expected: build succeeds; `dist/tutorials/01-what-is-an-agent/index.html` exists and contains "What Is an Agent".

- [ ] **Step 4: Verify the build output assertion**

```bash
test -f dist/tutorials/01-what-is-an-agent/index.html && grep -q "What Is an Agent" dist/tutorials/01-what-is-an-agent/index.html && echo OK
```

Expected: prints `OK`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add sample tutorial with in-browser Python runner"
```

---

### Task 13: README, full verification, manual Pyodide check

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Agentic Learning Book

An interactive web app teaching agentic AI. Tutorials are MDX; the Python
code runs entirely in your browser via Pyodide (no backend).

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
```

## Test & build

```bash
npm test         # unit tests (navigation helper)
npm run build    # static site -> dist/ (also validates content schema)
```

## Add a tutorial

Create `src/content/tutorials/NN-slug.mdx` with frontmatter
`title`, `order`, `summary`. It appears in the sidebar automatically,
ordered by `order`. Embed a runnable snippet with:

```mdx
import PyRunner from "../../components/PyRunner.tsx";

<PyRunner client:visible code={`print("hello")`} />
```

## Deploy

`dist/` is fully static — host on GitHub Pages, Netlify, or any static
host. No server required.
````

- [ ] **Step 2: Full test suite**

```bash
npm test
```

Expected: navigation tests PASS.

- [ ] **Step 3: Full production build**

```bash
npm run build
```

Expected: build succeeds; landing + `/tutorials/01-what-is-an-agent` generated.

- [ ] **Step 4: Manual in-browser Python verification**

```bash
npm run preview
```

Open `http://localhost:4321/tutorials/01-what-is-an-agent`, press **Run**.
Expected: after a Pyodide load delay, output panel shows:

```
obs='unknown topic' -> action='search'
obs='known fact' -> action='answer'
obs='unknown thing' -> action='search'
```

Stop preview (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add README; complete scaffold"
```

---

## Self-Review

**Spec coverage:**
- Static Astro site, MDX content collection, typed schema → Tasks 1,2,4 ✓
- Interactive Python in-browser, no backend → Task 11 (Pyodide CDN island) ✓
- Sidebar auto-generated, ordered by frontmatter → Task 7 ✓
- prev/next navigation → Tasks 5 (logic, TDD), 8, 10 ✓
- BaseLayout/TutorialLayout/Header → Tasks 6, 8 ✓
- Landing page → Task 9 ✓
- Sample lesson embedding PyRunner → Task 12 ✓
- Error handling: build-time schema validation (Task 4) + PyRunner loading/exception/CDN-failure states (Task 11) ✓
- Testing: `astro build` gate (every task) + nav unit tests (Task 5) + manual Pyodide check (Task 13) ✓
- Out of scope (accounts, persistence, server sandbox) — correctly excluded ✓

**Placeholder scan:** No TBD/TODO; every code step contains full content.

**Type consistency:** `NavEntry` ({slug,title,order}) defined in Task 5, consumed identically in Tasks 8 & 10. `getAdjacentTutorials` signature consistent across Tasks 5, 10. `PyRunner` prop `code: string` defined Task 11, used Task 12. Content schema fields (`title`, `order`, `summary`) consistent across Tasks 4, 7, 12.

No gaps found.
````
