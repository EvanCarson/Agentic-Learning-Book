# Curriculum Framework (Subsystem B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the site from a flat tutorials list into a single linear curriculum (modules → lessons) with open navigation, localStorage-backed completion tracking, and a swappable progress store.

**Architecture:** Stays a static Astro 6 site. A typed module config + `lessons` MDX collection feed a pure `curriculum` library (tree + flattened sequence + cross-module prev/next). A `ProgressStore` interface with a `LocalStorageProgressStore` implementation backs progress-reactive React islands (sidebar, syllabus, mark-complete). Subsystem A later swaps the store implementation only.

**Tech Stack:** Astro 6 (content layer, `glob` loader, `astro:content` `render`), React 19 islands, Tailwind v4 + typography, Zod, Vitest (TDD for pure logic), Playwright e2e (mandatory UI gate).

Working directory: repo root, branch off `main`.

---

### Task 0: Branch

- [ ] **Step 1: Create the feature branch**

```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
git checkout main && git pull --ff-only origin main
git checkout -b curriculum-framework
git branch --show-current
```
Expected: prints `curriculum-framework`.

---

## File Structure

```
src/content/modules.ts                  typed module config (order/metadata)
src/content.config.ts                   MODIFY: replace `tutorials` with `lessons` collection
src/content/lessons/*.mdx               lessons (migrated sample + skeleton)
src/lib/curriculum.ts                   pure: validate + build tree/sequence/adjacent
src/lib/progress/ProgressStore.ts       interface
src/lib/progress/LocalStorageProgressStore.ts  localStorage impl + guards
src/lib/progress/useProgress.ts         React hook over the store
src/components/SidebarNav.tsx           progress-reactive sidebar island
src/components/Sidebar.astro            MODIFY: mounts SidebarNav island
src/components/SyllabusView.tsx         progress-reactive /learn island
src/components/Syllabus.astro           mounts SyllabusView island
src/components/MarkComplete.tsx         mark-complete island
src/components/QuizStub.tsx             accessible "quiz coming soon" island
src/layouts/LessonLayout.astro          replaces TutorialLayout.astro
src/pages/learn/index.astro             syllabus page
src/pages/learn/[...slug].astro         lesson route
src/pages/index.astro                   MODIFY: CTA -> /learn
src/components/Header.astro             MODIFY: link -> /learn
astro.config.mjs                        MODIFY: add /tutorials -> /learn redirect
tests/curriculum.test.ts                unit tests (supersedes navigation.test.ts)
tests/LocalStorageProgressStore.test.ts unit tests
e2e/site.spec.ts                        MODIFY: new routes + curriculum scenarios
REMOVED: src/lib/navigation.ts, tests/navigation.test.ts,
         src/layouts/TutorialLayout.astro, src/components/Sidebar.astro (old),
         src/content/tutorials/, src/pages/tutorials/[...slug].astro
```

Note: spec named `Sidebar.astro`/`Syllabus.astro` as the components; progress must be client-reactive on a static site, so each is a thin Astro file mounting a React island. The `.astro` names from the spec are preserved as the mount points.

---

### Task 1: Module config

**Files:**
- Create: `src/content/modules.ts`

- [ ] **Step 1: Create `src/content/modules.ts`**

```ts
export interface Module {
  id: string;
  title: string;
  order: number;
  summary: string;
}

export const modules: Module[] = [
  {
    id: "foundations",
    title: "Foundations",
    order: 1,
    summary:
      "What an agent is and the perceive–decide–act loop that powers it.",
  },
  {
    id: "patterns",
    title: "Patterns & Best Practices",
    order: 2,
    summary: "Common agentic patterns and how to apply them well.",
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx astro check`
Expected: 0 errors (warnings/hints unrelated are acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/content/modules.ts
git commit -m "feat: add typed curriculum module config"
```

---

### Task 2: Pure curriculum library (TDD)

`buildCurriculum` validates cross-entry integrity and assembles the ordered tree + flattened sequence. `adjacent` returns prev/next across module boundaries (folds in the old `navigation.ts` logic).

**Files:**
- Create: `tests/curriculum.test.ts`
- Create: `src/lib/curriculum.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/curriculum.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildCurriculum, adjacent, type LessonMeta } from "../src/lib/curriculum";
import type { Module } from "../src/content/modules";

const mods: Module[] = [
  { id: "m1", title: "M1", order: 1, summary: "s1" },
  { id: "m2", title: "M2", order: 2, summary: "s2" },
];

const lessons: LessonMeta[] = [
  { slug: "a", moduleId: "m1", order: 2, type: "reading", title: "A", summary: "sa", estMinutes: 5 },
  { slug: "b", moduleId: "m1", order: 1, type: "interactive", title: "B", summary: "sb", estMinutes: 9 },
  { slug: "c", moduleId: "m2", order: 1, type: "quiz", title: "C", summary: "sc", estMinutes: 4 },
];

describe("buildCurriculum", () => {
  it("orders modules then lessons-within-module", () => {
    const c = buildCurriculum(mods, lessons);
    expect(c.modules.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(c.modules[0].lessons.map((l) => l.slug)).toEqual(["b", "a"]);
    expect(c.sequence.map((l) => l.slug)).toEqual(["b", "a", "c"]);
  });

  it("throws when a lesson references an unknown module", () => {
    const bad = [...lessons, { slug: "x", moduleId: "nope", order: 1, type: "reading", title: "X", summary: "s", estMinutes: 1 } as LessonMeta];
    expect(() => buildCurriculum(mods, bad)).toThrow(/unknown module "nope".*"x"/);
  });

  it("throws on duplicate (moduleId, order)", () => {
    const dup = [...lessons, { slug: "d", moduleId: "m1", order: 1, type: "reading", title: "D", summary: "s", estMinutes: 1 } as LessonMeta];
    expect(() => buildCurriculum(mods, dup)).toThrow(/duplicate order 1 in module "m1"/);
  });

  it("throws when a module has no lessons", () => {
    const mods3 = [...mods, { id: "m3", title: "M3", order: 3, summary: "s3" }];
    expect(() => buildCurriculum(mods3, lessons)).toThrow(/module "m3" has no lessons/);
  });
});

describe("adjacent", () => {
  const c = buildCurriculum(mods, lessons);
  it("null prev for first, next is second", () => {
    expect(adjacent(c, "b")).toEqual({
      prev: null,
      next: c.sequence[1],
    });
  });
  it("spans module boundary (a -> c across m1/m2)", () => {
    expect(adjacent(c, "a").next?.slug).toBe("c");
    expect(adjacent(c, "c").prev?.slug).toBe("a");
  });
  it("null next for last", () => {
    expect(adjacent(c, "c").next).toBeNull();
  });
  it("both null for unknown slug", () => {
    expect(adjacent(c, "zzz")).toEqual({ prev: null, next: null });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx vitest run tests/curriculum.test.ts`
Expected: FAIL — cannot resolve `../src/lib/curriculum`.

- [ ] **Step 3: Write the implementation**

> **Amendment (applied during execution):** `buildCurriculum` also rejects
> globally-duplicate lesson `slug`s (slug is the route key; duplicates
> silently corrupt the sequence). A `Set<string>` slug check throwing
> `Curriculum: duplicate lesson slug "<slug>"` runs at the start of
> `buildCurriculum`, with a matching unit test. Coverage also includes a
> single-lesson curriculum adjacency case (both prev/next null).

Create `src/lib/curriculum.ts`:

```ts
import type { Module } from "../content/modules";

export type LessonType = "reading" | "interactive" | "quiz";

export interface LessonMeta {
  slug: string;
  moduleId: string;
  order: number;
  type: LessonType;
  title: string;
  summary: string;
  estMinutes: number;
}

export interface ModuleWithLessons extends Module {
  lessons: LessonMeta[];
}

export interface Curriculum {
  modules: ModuleWithLessons[];
  sequence: LessonMeta[];
}

export function buildCurriculum(
  modules: Module[],
  lessons: LessonMeta[],
): Curriculum {
  const byId = new Map(modules.map((m) => [m.id, m]));

  for (const l of lessons) {
    if (!byId.has(l.moduleId)) {
      throw new Error(
        `Curriculum: unknown module "${l.moduleId}" referenced by lesson "${l.slug}"`,
      );
    }
  }

  const orderedModules = [...modules].sort((a, b) => a.order - b.order);

  const builtModules: ModuleWithLessons[] = orderedModules.map((m) => {
    const own = lessons
      .filter((l) => l.moduleId === m.id)
      .sort((a, b) => a.order - b.order);

    if (own.length === 0) {
      throw new Error(`Curriculum: module "${m.id}" has no lessons`);
    }

    const seen = new Set<number>();
    for (const l of own) {
      if (seen.has(l.order)) {
        throw new Error(
          `Curriculum: duplicate order ${l.order} in module "${m.id}"`,
        );
      }
      seen.add(l.order);
    }

    return { ...m, lessons: own };
  });

  const sequence = builtModules.flatMap((m) => m.lessons);
  return { modules: builtModules, sequence };
}

export interface Adjacent {
  prev: LessonMeta | null;
  next: LessonMeta | null;
}

export function adjacent(curriculum: Curriculum, slug: string): Adjacent {
  const seq = curriculum.sequence;
  const i = seq.findIndex((l) => l.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? seq[i - 1] : null,
    next: i < seq.length - 1 ? seq[i + 1] : null,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/curriculum.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Remove the superseded navigation module AND its consumers**

> **Amendment (applied during execution):** The original plan removed only
> `navigation.ts` + its test here and deferred deleting
> `src/layouts/TutorialLayout.astro` and `src/pages/tutorials/[...slug].astro`
> to Task 9. But those two files import `navigation.ts`, so removing it
> alone breaks `astro check`/`build`. They are superseded anyway, so their
> deletion is pulled forward into this step (Task 9 no longer deletes them).
> The `tutorials` content collection, the tutorial MDX, and the
> `/tutorials/...` href strings in `index.astro`/`Header.astro` remain
> until Task 9 (a static build does not fail on internal dead links).

```bash
git rm src/lib/navigation.ts tests/navigation.test.ts
git rm src/pages/tutorials/[...slug].astro src/layouts/TutorialLayout.astro
grep -rn "navigation\|TutorialLayout\|pages/tutorials" src/ || echo "no references"
npx vitest run
npx astro check
npm run build
```
Expected: `no references`; vitest runs only `tests/curriculum.test.ts`, all
PASS; `astro check` 0/0/0; build succeeds with **1 page** (`/index.html`
only — the old `/tutorials` route is gone and the tutorial MDX is now
orphaned content with no page until Task 9).

- [ ] **Step 6: Commit**

```bash
git add src/lib/curriculum.ts tests/curriculum.test.ts
git commit -m "feat: add pure curriculum library; remove navigation.ts"
```

---

### Task 3: Progress store (TDD)

**Files:**
- Create: `tests/LocalStorageProgressStore.test.ts`
- Create: `src/lib/progress/ProgressStore.ts`
- Create: `src/lib/progress/LocalStorageProgressStore.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/LocalStorageProgressStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createLocalStorageProgressStore } from "../src/lib/progress/LocalStorageProgressStore";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe("LocalStorageProgressStore", () => {
  let storage: Storage;
  beforeEach(() => { storage = memoryStorage(); });

  it("round-trips completion and lastVisited", () => {
    const s = createLocalStorageProgressStore(storage);
    expect(s.isComplete("a")).toBe(false);
    s.setComplete("a", true);
    s.setLastVisited("a");
    const s2 = createLocalStorageProgressStore(storage);
    expect(s2.isComplete("a")).toBe(true);
    expect(s2.lastVisited()).toBe("a");
    expect(s2.all()).toEqual({ a: true });
  });

  it("setComplete(false) clears completion", () => {
    const s = createLocalStorageProgressStore(storage);
    s.setComplete("a", true);
    s.setComplete("a", false);
    expect(s.isComplete("a")).toBe(false);
  });

  it("recovers from corrupt JSON without throwing", () => {
    storage.setItem("alb:progress", "{not json");
    const s = createLocalStorageProgressStore(storage);
    expect(s.isComplete("a")).toBe(false);
    expect(() => s.setComplete("a", true)).not.toThrow();
    expect(s.isComplete("a")).toBe(true);
  });

  it("falls back to memory when storage access throws", () => {
    const throwing = {
      get length() { return 0; },
      clear: () => {},
      getItem: () => { throw new Error("blocked"); },
      key: () => null,
      removeItem: () => {},
      setItem: () => { throw new Error("blocked"); },
    } as Storage;
    const s = createLocalStorageProgressStore(throwing);
    expect(s.isComplete("a")).toBe(false);
    expect(() => s.setComplete("a", true)).not.toThrow();
    expect(s.isComplete("a")).toBe(true); // held in memory
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/LocalStorageProgressStore.test.ts`
Expected: FAIL — cannot resolve the module.

- [ ] **Step 3: Write the interface**

Create `src/lib/progress/ProgressStore.ts`:

```ts
export interface ProgressStore {
  isComplete(slug: string): boolean;
  setComplete(slug: string, value: boolean): void;
  lastVisited(): string | null;
  setLastVisited(slug: string): void;
  all(): Record<string, boolean>;
}
```

- [ ] **Step 4: Write the implementation**

Create `src/lib/progress/LocalStorageProgressStore.ts`:

```ts
import type { ProgressStore } from "./ProgressStore";

const KEY = "alb:progress";

interface Shape {
  completed: Record<string, boolean>;
  lastVisited: string | null;
}

function emptyShape(): Shape {
  return { completed: {}, lastVisited: null };
}

export function createLocalStorageProgressStore(
  backing?: Storage,
): ProgressStore {
  const storage: Storage | null =
    backing ??
    (typeof globalThis !== "undefined" &&
    (globalThis as { localStorage?: Storage }).localStorage
      ? (globalThis as { localStorage: Storage }).localStorage
      : null);

  let memory: Shape = emptyShape();

  function read(): Shape {
    if (!storage) return memory;
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return memory;
      const parsed = JSON.parse(raw) as Partial<Shape>;
      return {
        completed: parsed.completed ?? {},
        lastVisited: parsed.lastVisited ?? null,
      };
    } catch {
      return memory;
    }
  }

  function write(next: Shape): void {
    memory = next;
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("alb:progress-changed"));
      }
    } catch {
      /* memory already updated; ignore */
    }
  }

  return {
    isComplete: (slug) => read().completed[slug] === true,
    setComplete: (slug, value) => {
      const s = read();
      const completed = { ...s.completed };
      if (value) completed[slug] = true;
      else delete completed[slug];
      write({ ...s, completed });
    },
    lastVisited: () => read().lastVisited,
    setLastVisited: (slug) => {
      const s = read();
      write({ ...s, lastVisited: slug });
    },
    all: () => ({ ...read().completed }),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/LocalStorageProgressStore.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/progress/ProgressStore.ts src/lib/progress/LocalStorageProgressStore.ts tests/LocalStorageProgressStore.test.ts
git commit -m "feat: add ProgressStore interface and localStorage implementation"
```

---

### Task 4: useProgress hook

A React hook giving islands a live view of the store, re-rendering on the custom `alb:progress-changed` event and cross-tab `storage` events. (Covered by e2e, not unit-tested — keeps vitest in node env without jsdom.)

**Files:**
- Create: `src/lib/progress/useProgress.ts`

- [ ] **Step 1: Create `src/lib/progress/useProgress.ts`**

> **Amendment (applied during execution of Task 3):** the event name is now
> the shared constant `PROGRESS_CHANGED_EVENT` exported from
> `./ProgressStore` — import and use it instead of the literal string so
> the dispatcher and this listener cannot drift apart.

> **Amendment 2 (Task 4 review):** the cross-tab `storage` listener is
> filtered to the progress key so unrelated localStorage writes don't
> force re-renders. The key is the shared `PROGRESS_STORAGE_KEY` constant
> (also exported from `./ProgressStore` and used by
> `LocalStorageProgressStore`, replacing its private `KEY`).

```ts
import { useCallback, useEffect, useState } from "react";
import { createLocalStorageProgressStore } from "./LocalStorageProgressStore";
import { PROGRESS_CHANGED_EVENT, PROGRESS_STORAGE_KEY } from "./ProgressStore";

const store = createLocalStorageProgressStore();

export function useProgress() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = (e?: Event) => {
      if (
        e instanceof StorageEvent &&
        e.key !== null &&
        e.key !== PROGRESS_STORAGE_KEY
      ) {
        return;
      }
      setTick((t) => t + 1);
    };
    window.addEventListener(PROGRESS_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(PROGRESS_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const isComplete = useCallback(
    (slug: string) => store.isComplete(slug),
    [tick],
  );
  const setComplete = useCallback(
    (slug: string, value: boolean) => store.setComplete(slug, value),
    [],
  );
  const setLastVisited = useCallback(
    (slug: string) => store.setLastVisited(slug),
    [],
  );
  const lastVisited = useCallback(() => store.lastVisited(), [tick]);
  const all = useCallback(() => store.all(), [tick]);

  return { isComplete, setComplete, setLastVisited, lastVisited, all };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/progress/useProgress.ts
git commit -m "feat: add useProgress React hook"
```

---

### Task 5: QuizStub and MarkComplete islands

> **Amendment (review):** QuizStub's `role="note"` div also gets
> `aria-label={`Quiz: ${title}`}`; MarkComplete's incomplete-state class
> adds explicit `text-gray-900 dark:text-gray-100` (resilient inside
> `not-prose`); the decorative `✓` is wrapped in
> `<span aria-hidden="true">` — consistent with the project a11y standard.

**Files:**
- Create: `src/components/QuizStub.tsx`
- Create: `src/components/MarkComplete.tsx`

- [ ] **Step 1: Create `src/components/QuizStub.tsx`**

```tsx
export default function QuizStub({ title }: { title: string }) {
  return (
    <div
      role="note"
      className="my-6 rounded border border-dashed border-gray-400 p-6 text-center dark:border-gray-600"
    >
      <p className="text-lg font-semibold">Quiz: {title}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Knowledge checks are coming soon. For now, review the lesson and
        mark it complete when you are confident.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/MarkComplete.tsx`**

```tsx
import { useProgress } from "../lib/progress/useProgress";

export default function MarkComplete({ slug }: { slug: string }) {
  const { isComplete, setComplete } = useProgress();
  const done = isComplete(slug);
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => setComplete(slug, !done)}
      className={
        done
          ? "rounded bg-green-600 px-4 py-2 text-sm font-medium text-white"
          : "rounded border border-gray-400 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
      }
    >
      {done ? "✓ Completed" : "Mark complete"}
    </button>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuizStub.tsx src/components/MarkComplete.tsx
git commit -m "feat: add QuizStub and MarkComplete islands"
```

---

### Task 6: SidebarNav island + Sidebar.astro

> **Amendment (review):** each completed lesson link also renders a
> visually-hidden `<span className="sr-only"> (completed)</span>` so screen
> readers announce completion state (the ✓/○ glyph stays `aria-hidden`).

**Files:**
- Create: `src/components/SidebarNav.tsx`
- Delete + recreate: `src/components/Sidebar.astro`

- [ ] **Step 1: Create `src/components/SidebarNav.tsx`**

```tsx
import { useProgress } from "../lib/progress/useProgress";
import type { Curriculum } from "../lib/curriculum";

export default function SidebarNav({
  curriculum,
  currentSlug,
}: {
  curriculum: Curriculum;
  currentSlug: string;
}) {
  const { isComplete } = useProgress();
  return (
    <nav aria-label="Curriculum" className="text-sm">
      {curriculum.modules.map((m) => (
        <div key={m.id} className="mb-4">
          <p className="mb-1 font-semibold uppercase tracking-wide text-gray-500">
            {m.title}
          </p>
          <ul className="space-y-1">
            {m.lessons.map((l) => {
              const active = l.slug === currentSlug;
              return (
                <li key={l.slug}>
                  <a
                    href={`/learn/${l.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "font-semibold text-blue-600 hover:underline"
                        : "text-gray-700 hover:underline dark:text-gray-300"
                    }
                  >
                    <span aria-hidden="true">
                      {isComplete(l.slug) ? "✓ " : "○ "}
                    </span>
                    {l.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Replace `src/components/Sidebar.astro`**

```bash
git rm src/components/Sidebar.astro
```

Create `src/components/Sidebar.astro`:

```astro
---
import SidebarNav from "./SidebarNav.tsx";
import type { Curriculum } from "../lib/curriculum";

interface Props { curriculum: Curriculum; currentSlug: string }
const { curriculum, currentSlug } = Astro.props;
---
<SidebarNav client:load curriculum={curriculum} currentSlug={currentSlug} />
```

- [ ] **Step 3: Typecheck**

Run: `npx astro check`
Expected: 0 errors. (Sidebar is not yet referenced anywhere; that is fine.)

- [ ] **Step 4: Commit**

```bash
git add src/components/SidebarNav.tsx src/components/Sidebar.astro
git commit -m "feat: progress-reactive SidebarNav island grouped by module"
```

---

### Task 7: SyllabusView island + Syllabus.astro + /learn index

> **Amendment (review):** SyllabusView also (1) renders an `sr-only`
> ` (completed)` span on completed lessons (SR parity with SidebarNav),
> (2) dedupes `isComplete` via a `done` local in the lesson map, and
> (3) ignores a `lastVisited` slug not present in the current curriculum
> (`knownSlugs` guard) so the Continue link can't 404.

**Files:**
- Create: `src/components/SyllabusView.tsx`
- Create: `src/components/Syllabus.astro`
- Create: `src/pages/learn/index.astro`

- [ ] **Step 1: Create `src/components/SyllabusView.tsx`**

```tsx
import { useProgress } from "../lib/progress/useProgress";
import type { Curriculum } from "../lib/curriculum";

export default function SyllabusView({
  curriculum,
}: {
  curriculum: Curriculum;
}) {
  const { isComplete, lastVisited } = useProgress();
  const last = lastVisited();
  const firstIncomplete = curriculum.sequence.find((l) => !isComplete(l.slug));
  const continueSlug = last ?? firstIncomplete?.slug ?? curriculum.sequence[0]?.slug;

  return (
    <div>
      {continueSlug && (
        <a
          href={`/learn/${continueSlug}`}
          className="mb-8 inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Continue where you left off →
        </a>
      )}
      {curriculum.modules.map((m) => (
        <section key={m.id} className="mb-10">
          <h2 className="text-2xl font-bold">{m.title}</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{m.summary}</p>
          <ul className="mt-4 space-y-2">
            {m.lessons.map((l) => (
              <li key={l.slug}>
                <a
                  href={`/learn/${l.slug}`}
                  className="flex items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  <span aria-hidden="true">
                    {isComplete(l.slug) ? "✓" : "○"}
                  </span>
                  <span className="font-medium">{l.title}</span>
                  <span className="ml-auto text-xs uppercase tracking-wide text-gray-500">
                    {l.type} · {l.estMinutes} min
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/Syllabus.astro`**

```astro
---
import SyllabusView from "./SyllabusView.tsx";
import type { Curriculum } from "../lib/curriculum";

interface Props { curriculum: Curriculum }
const { curriculum } = Astro.props;
---
<SyllabusView client:load curriculum={curriculum} />
```

- [ ] **Step 3: Create `src/pages/learn/index.astro`**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Syllabus from "../../components/Syllabus.astro";
import { buildCurriculum, type LessonMeta } from "../../lib/curriculum";
import { modules } from "../../content/modules";

const entries = await getCollection("lessons");
const lessons: LessonMeta[] = entries.map((e) => ({
  slug: e.id,
  moduleId: e.data.moduleId,
  order: e.data.order,
  type: e.data.type,
  title: e.data.title,
  summary: e.data.summary,
  estMinutes: e.data.estMinutes,
}));
const curriculum = buildCurriculum(modules, lessons);
---
<BaseLayout title="Curriculum">
  <h1 class="mb-6 text-4xl font-bold">Agentic AI Curriculum</h1>
  <Syllabus curriculum={curriculum} />
</BaseLayout>
```

- [ ] **Step 4: Typecheck**

Run: `npx astro check`
Expected: 0 errors. (The `lessons` collection is added in Task 9; until then `getCollection("lessons")` may type-error. If so, this task's typecheck is deferred — proceed and it is verified green at the end of Task 9. Note this explicitly in the commit body.)

- [ ] **Step 5: Commit**

```bash
git add src/components/SyllabusView.tsx src/components/Syllabus.astro src/pages/learn/index.astro
git commit -m "feat: add Syllabus view and /learn index (lessons collection lands in Task 9)"
```

---

### Task 8: LessonLayout + lesson route

**Files:**
- Create: `src/layouts/LessonLayout.astro`
- Create: `src/pages/learn/[...slug].astro`

- [ ] **Step 1: Create `src/layouts/LessonLayout.astro`**

```astro
---
import BaseLayout from "./BaseLayout.astro";
import Sidebar from "../components/Sidebar.astro";
import MarkComplete from "../components/MarkComplete.tsx";
import QuizStub from "../components/QuizStub.tsx";
import type { Curriculum, LessonMeta, Adjacent } from "../lib/curriculum";

interface Props {
  lesson: LessonMeta;
  curriculum: Curriculum;
  adjacent: Adjacent;
}
const { lesson, curriculum, adjacent } = Astro.props;
---
<BaseLayout title={lesson.title}>
  <div class="grid grid-cols-1 gap-8 md:grid-cols-[16rem_1fr]">
    <aside class="md:border-r md:border-gray-200 md:pr-4 md:dark:border-gray-800">
      <Sidebar curriculum={curriculum} currentSlug={lesson.slug} />
    </aside>
    <article class="prose max-w-none dark:prose-invert">
      <p class="text-xs uppercase tracking-wide text-gray-500">
        {lesson.type} · {lesson.estMinutes} min
      </p>
      <h1>{lesson.title}</h1>
      {lesson.type === "quiz" ? (
        <QuizStub client:load title={lesson.title} />
      ) : (
        <slot />
      )}
      <div class="mt-8 not-prose">
        <MarkComplete client:load slug={lesson.slug} />
      </div>
      <nav
        aria-label="Lesson navigation"
        class="mt-12 flex justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-800"
      >
        {adjacent.prev ? (
          <a href={`/learn/${adjacent.prev.slug}`}>← {adjacent.prev.title}</a>
        ) : <span />}
        {adjacent.next ? (
          <a href={`/learn/${adjacent.next.slug}`}>{adjacent.next.title} →</a>
        ) : <span />}
      </nav>
    </article>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/learn/[...slug].astro`**

```astro
---
import { getCollection, render } from "astro:content";
import LessonLayout from "../../layouts/LessonLayout.astro";
import { buildCurriculum, adjacent, type LessonMeta } from "../../lib/curriculum";
import { modules } from "../../content/modules";

export async function getStaticPaths() {
  const entries = await getCollection("lessons");
  const lessons: LessonMeta[] = entries.map((e) => ({
    slug: e.id,
    moduleId: e.data.moduleId,
    order: e.data.order,
    type: e.data.type,
    title: e.data.title,
    summary: e.data.summary,
    estMinutes: e.data.estMinutes,
  }));
  const curriculum = buildCurriculum(modules, lessons);
  return entries.map((entry) => {
    const lesson = lessons.find((l) => l.slug === entry.id)!;
    return {
      params: { slug: entry.id },
      props: { entry, lesson, curriculum, adjacent: adjacent(curriculum, entry.id) },
    };
  });
}

type Props = Awaited<ReturnType<typeof getStaticPaths>>[number]["props"];
const { entry, lesson, curriculum, adjacent: adj } = Astro.props as Props;
const { Content } = await render(entry);
---
<LessonLayout lesson={lesson} curriculum={curriculum} adjacent={adj}>
  <Content />
</LessonLayout>
```

- [ ] **Step 3: Typecheck (deferred like Task 7)**

Run: `npx astro check`
Expected: clean once Task 9 adds the `lessons` collection; until then `getCollection("lessons")` type errors are expected and resolved at end of Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/LessonLayout.astro src/pages/learn/[...slug].astro
git commit -m "feat: add LessonLayout and /learn/[...slug] route"
```

---

### Task 9: Content model migration + cleanup

> **Amendment 9b (review):** lesson `order` schema tightened from
> `.nonnegative()` to `.positive()` (one-based, matches all data); the
> Header Curriculum link gets `aria-current="page"` on `/learn*` via
> `Astro.url`; CLAUDE.md Project says "Lessons are MDX" and the
> Adding-a-lesson section gains build-time-moduleId / quiz-body-suppressed
> caveats.

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/lessons/01-what-is-an-agent.mdx` (migrated)
- Create: `src/content/lessons/02-agent-anatomy.mdx`
- Create: `src/content/lessons/03-foundations-check.mdx`
- Create: `src/content/lessons/04-tool-use.mdx`
- Modify: `src/pages/index.astro`, `src/components/Header.astro`, `astro.config.mjs`, `CLAUDE.md`
- Delete: `src/content/tutorials/` (TutorialLayout.astro and the tutorials route were already deleted in Task 2 — see amendment there)

> **Amendment:** This task must also refresh `CLAUDE.md`'s Architecture
> and "Adding a tutorial" sections — they still describe the removed
> `navigation.ts`, `TutorialLayout.astro`, the `/tutorials` route, and
> `getAdjacentTutorials`. Update them to the curriculum model
> (`modules.ts`, `curriculum.ts`, `LessonLayout`, `/learn` routes,
> `lessons` collection schema, the progress store) so the agent-guidance
> file matches reality.

- [ ] **Step 1: Replace `src/content.config.ts`**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    moduleId: z.string(),
    order: z.number().int().nonnegative(),
    type: z.enum(["reading", "interactive", "quiz"]),
    summary: z.string(),
    estMinutes: z.number().int().positive(),
  }),
});

export const collections = { lessons };
```

- [ ] **Step 2: Migrate the sample lesson**

```bash
mkdir -p src/content/lessons
git mv src/content/tutorials/01-what-is-an-agent.mdx src/content/lessons/01-what-is-an-agent.mdx
```

Replace the frontmatter block at the top of `src/content/lessons/01-what-is-an-agent.mdx` (everything between the first pair of `---`) with exactly:

```mdx
---
title: "What Is an Agent?"
moduleId: "foundations"
order: 1
type: "interactive"
summary: "The perceive–decide–act loop, run in your browser."
estMinutes: 10
---
```

Leave the rest of the file (import + prose + `<PyRunner>`) unchanged.

- [ ] **Step 3: Create `src/content/lessons/02-agent-anatomy.mdx`**

```mdx
---
title: "Anatomy of an Agent"
moduleId: "foundations"
order: 2
type: "reading"
summary: "Perception, policy, action, memory — the parts every agent has."
estMinutes: 6
---

Every agent, however simple, has four moving parts:

- **Perception** — turning the environment into an observation.
- **Policy** — deciding the next action from that observation.
- **Action** — affecting the world (a tool call, an answer, a step).
- **Memory** — carrying state across loop iterations.

Keeping these separable is the first best practice: you can test the
policy without a real environment, and swap perception or tools without
rewriting the loop.
```

- [ ] **Step 4: Create `src/content/lessons/03-foundations-check.mdx`**

```mdx
---
title: "Foundations Check"
moduleId: "foundations"
order: 3
type: "quiz"
summary: "Quick knowledge check on agent fundamentals."
estMinutes: 5
---

This lesson is a knowledge check. The interactive quiz engine is coming
soon; for now, review the Foundations module and mark it complete when
you are confident.
```

- [ ] **Step 5: Create `src/content/lessons/04-tool-use.mdx`**

```mdx
---
title: "Tool Use"
moduleId: "patterns"
order: 1
type: "reading"
summary: "Giving agents tools so their actions can affect the world."
estMinutes: 7
---

A bare agent can only think. **Tools** let it act: search, run code,
call an API, query a database. The pattern is always the same — the
policy chooses a tool and arguments, the runtime executes it, and the
result becomes the next observation.

Best practice: keep each tool small, well-described, and independently
testable, exactly like the agent parts in the previous module.
```

- [ ] **Step 6: Update `src/pages/index.astro` CTA**

In `src/pages/index.astro`, change the CTA anchor's `href` and label. Replace:

```astro
    <a
      href="/tutorials/01-what-is-an-agent"
      class="mt-8 inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
    >
      Begin: What Is an Agent &rarr;
    </a>
```

with:

```astro
    <a
      href="/learn"
      class="mt-8 inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
    >
      Start the curriculum &rarr;
    </a>
```

- [ ] **Step 7: Update `src/components/Header.astro` link**

In `src/components/Header.astro`, replace:

```astro
    <a href="/tutorials/01-what-is-an-agent" class="text-sm underline">
      Start learning
    </a>
```

with:

```astro
    <a href="/learn" class="text-sm underline">
      Curriculum
    </a>
```

- [ ] **Step 8: Add the redirect and remove old route/layout/dir**

In `astro.config.mjs`, add a top-level `redirects` key to the `defineConfig({ ... })` object (alongside `integrations`):

```js
  redirects: {
    "/tutorials/[...slug]": "/learn/[...slug]",
  },
```

Then remove the remaining superseded content directory:

> **Amendment:** `src/pages/tutorials/[...slug].astro` and
> `src/layouts/TutorialLayout.astro` were already deleted in Task 2 Step 5
> (they imported the removed `navigation.ts`). Do NOT re-`git rm` them here.

```bash
git rm -r src/content/tutorials 2>/dev/null || true
git add astro.config.mjs src/content.config.ts src/content/lessons src/pages/index.astro src/components/Header.astro
```

- [ ] **Step 9: Full typecheck + build (resolves Task 7/8 deferrals)**

Run:
```bash
npx astro check
npm run build
```
Expected: `astro check` 0 errors / 0 warnings / 0 hints. `npm run build` succeeds; pages built include `/index.html`, `/learn/index.html`, `/learn/01-what-is-an-agent/index.html`, `/learn/02-agent-anatomy/index.html`, `/learn/03-foundations-check/index.html`, `/learn/04-tool-use/index.html`, and a redirect artifact for `/tutorials/01-what-is-an-agent`.

- [ ] **Step 10: Assert build output**

```bash
test -f dist/learn/index.html && test -f dist/learn/01-what-is-an-agent/index.html && test -f dist/learn/04-tool-use/index.html && echo PAGES_OK
grep -rq "/learn/01-what-is-an-agent" dist/tutorials/01-what-is-an-agent/index.html && echo REDIRECT_OK
```
Expected: prints `PAGES_OK` and `REDIRECT_OK`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: migrate to lessons collection + curriculum routes; redirect old tutorials path"
```

---

### Task 10: e2e coverage + final gates

> **Amendment 10 (review):** syllabus heading query scoped to
> `getByRole("main")` (avoids global `nth()` brittleness); the prev/next
> test also asserts the sidebar's active-lesson `aria-current="page"`
> (scoped to the `Curriculum` nav, since the Header link also carries
> aria-current on `/learn*`).

**Files:**
- Modify: `e2e/site.spec.ts`

- [ ] **Step 1: Replace `e2e/site.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test("renders and links to the curriculum", async ({ page }) => {
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("favicon"))
        errs.push(m.text());
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Learn to build AI agents" }),
    ).toBeVisible();
    const cta = page.getByRole("link", { name: /Start the curriculum/i });
    await expect(cta).toHaveAttribute("href", "/learn");
    expect(errs, errs.join("\n")).toHaveLength(0);
  });
});

test.describe("curriculum", () => {
  test("syllabus lists modules in order with their lessons", async ({ page }) => {
    await page.goto("/learn");
    const headings = page.getByRole("heading", { level: 2 });
    await expect(headings.nth(0)).toHaveText("Foundations");
    await expect(headings.nth(1)).toHaveText("Patterns & Best Practices");
    await expect(
      page.getByRole("link", { name: /What Is an Agent\?/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Tool Use/ }),
    ).toBeVisible();
  });

  test("prev/next spans the module boundary", async ({ page }) => {
    await page.goto("/learn/03-foundations-check");
    await page.getByRole("link", { name: /Tool Use →/ }).click();
    await expect(page).toHaveURL(/\/learn\/04-tool-use$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Tool Use" }),
    ).toBeVisible();
  });

  test("mark complete persists across reload", async ({ page }) => {
    await page.goto("/learn/02-agent-anatomy");
    const btn = page.getByRole("button", { name: /Mark complete/i });
    await btn.click();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
  });

  test("quiz lesson renders the accessible stub", async ({ page }) => {
    await page.goto("/learn/03-foundations-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
  });

  test("interactive lesson still runs Python in-browser", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/learn/01-what-is-an-agent");
    await page.getByRole("button", { name: /Run|Loading|Running/i }).click();
    const out = page.locator("pre[aria-live='polite']");
    await expect(out).toContainText("obs='unknown thing' -> action='search'", {
      timeout: 90_000,
    });
    await expect(out).toContainText("obs='unknown topic' -> action='search'");
    await expect(out).toContainText("obs='known fact' -> action='answer'");
  });

  test("old tutorials URL redirects to the new lesson path", async ({ page }) => {
    await page.goto("/tutorials/01-what-is-an-agent");
    await expect(page).toHaveURL(/\/learn\/01-what-is-an-agent\/?$/);
  });
});
```

- [ ] **Step 2: Run unit + typecheck + build**

```bash
npm test
npx astro check
npm run build
```
Expected: vitest all green (curriculum + LocalStorageProgressStore suites); `astro check` 0/0/0; build succeeds.

- [ ] **Step 3: Run the e2e suite (network required for Pyodide)**

Run: `CI=1 npx playwright test --reporter=list`
Expected: all e2e tests pass, including `interactive lesson still runs Python in-browser` (asserts real Pyodide output) and the redirect test. (Run where the Pyodide CDN is reachable; the interactive test fails honestly if it is not.)

- [ ] **Step 4: Commit**

```bash
git add e2e/site.spec.ts
git commit -m "test: e2e for curriculum routes, progress, quiz stub, redirect"
```

---

## Self-Review

**Spec coverage:**
- Single linear path → modules → lessons → Task 1 (`modules.ts`) + Task 9 (lessons) + Task 2 (assembly) ✓
- Lesson types reading/interactive/quiz(stub) → Task 9 schema enum + Task 8 type rendering + Task 5 QuizStub ✓
- Open navigation + progress tracking (no gating) → Tasks 6/7/8 link freely; Tasks 3/4 progress ✓
- ProgressStore interface + LocalStorageProgressStore now, swappable later → Task 3 ✓
- A1 modeling: typed module config + lessons MDX + build-time integrity check → Task 1, Task 9 schema, Task 2 `buildCurriculum` throws (runs in page `getStaticPaths`/`/learn` → fails `npm run build`) ✓ (Note: cross-entry integrity fails `astro build`, not `astro check`; `astro check` covers types — consistent with how Astro works; spec intent preserved.)
- Migration: sample → lesson, route `/tutorials`→`/learn` with redirect, CTA, remove old → Task 9 ✓
- `curriculum.ts` supersedes `navigation.ts`, tests migrate → Task 2 Step 5 ✓
- `LessonLayout` replaces `TutorialLayout`; Mark complete island → Task 8, Task 5 ✓
- Sidebar grouped by module + completion + aria-current → Task 6 ✓
- Syllabus + continue control → Task 7 ✓
- Error handling: build integrity throw (Task 2), storage guards (Task 3), unknown type safe (schema enum constrains; Task 8 renders quiz branch / slot), quiz explicit stub (Task 5) ✓
- Testing: unit curriculum + store (Tasks 2,3 TDD), typecheck/build (Task 9), e2e all scenarios incl. interactive regression + redirect (Task 10) ✓
- Out of scope respected: no auth/quiz-engine/LLM/full content ✓

**Placeholder scan:** No TBD/TODO; every code step has full content. Tasks 7/8 typecheck deferral is explicit and resolved in Task 9 Step 9 (documented, not a placeholder).

**Type consistency:** `LessonMeta` ({slug,moduleId,order,type,title,summary,estMinutes}) defined Task 2, mapped identically from `getCollection` entries in Tasks 7 & 8. `Curriculum`/`Adjacent` from Task 2 consumed in Tasks 6,7,8. `ProgressStore` (Task 3) implemented by `createLocalStorageProgressStore`, consumed by `useProgress` (Task 4) used in Tasks 5,6,7. Schema fields (Task 9) exactly match `LessonMeta` mapping. `modules` export (Task 1) imported in Tasks 7,8. Route base `/learn/<slug>` consistent across Tasks 6,7,8,9,10.

No gaps.
