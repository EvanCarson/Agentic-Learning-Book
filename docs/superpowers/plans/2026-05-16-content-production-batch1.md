# Content Production Batch 1 (Subsystem E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author Module 1 "Foundations" end-to-end (5 lessons) as the quality template for the curriculum, reduce `modules.ts` to the single authored module, and update the e2e suite to match.

**Architecture:** Pure content + data. No framework/component/library code changes. `src/content/modules.ts` becomes a single `foundations` module; `src/content/lessons/` holds 5 MDX lessons (2 reading, 2 interactive pure-Python/Pyodide, 1 quiz stub); `e2e/site.spec.ts` is rewritten for the new lessons. Verification per task is `npx astro check` + `npm run build` staying green; the full networked Playwright run is the final gate.

**Tech Stack:** Astro 6 content collections (B framework, unchanged), MDX, PyRunner island (unchanged), Playwright e2e, Vitest (15 unit tests unchanged — no logic touched).

Working directory: repo root, branch off `main` (B merged).

**Invariant:** every commit must keep `npx astro check` 0/0/0 and `npm run build` green. The B `buildCurriculum` throws on an unknown `moduleId`, a duplicate `(moduleId, order)`, or a module with no lessons — task ordering below preserves these at every step.

---

### Task 0: Branch

- [ ] **Step 1: Create the feature branch**

```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
git checkout main && git pull --ff-only origin main
git checkout -b content-batch-1
git branch --show-current
```
Expected: prints `content-batch-1`.

---

## File Structure

```
src/content/modules.ts                       MODIFY: single `foundations` module
src/content/lessons/01-what-is-an-agent.mdx  REWRITE: interactive -> reading (slug preserved)
src/content/lessons/02-the-agent-loop.mdx    CREATE: interactive (e2e PyRunner anchor)
src/content/lessons/03-the-mock-llm.mdx      CREATE: interactive (MockLLM harness)
src/content/lessons/04-agent-anatomy.mdx     RENAME from 02-agent-anatomy.mdx + rewrite (reading)
src/content/lessons/05-foundations-check.mdx RENAME from 03-foundations-check.mdx + rewrite (quiz)
src/content/lessons/04-tool-use.mdx          DELETE (deferred to the Tool Use batch)
e2e/site.spec.ts                             REWRITE for the new lessons
```

---

### Task 1: Reduce modules.ts to Foundations; drop the deferred lesson

After this task: lessons present are `01-what-is-an-agent` (interactive, o1), `02-agent-anatomy` (reading, o2), `03-foundations-check` (quiz, o3) — all `moduleId: "foundations"`, unique orders → build green.

**Files:**
- Modify: `src/content/modules.ts`
- Delete: `src/content/lessons/04-tool-use.mdx`

- [ ] **Step 1: Replace `src/content/modules.ts` entirely**

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
      "The agent loop, the LLM as decision policy, and the deterministic mock-LLM harness every later module builds on.",
  },
];
```

- [ ] **Step 2: Remove the deferred lesson (its module no longer exists)**

```bash
git rm src/content/lessons/04-tool-use.mdx
```

- [ ] **Step 3: Verify gates green**

```bash
npx astro check
npm run build
```
Expected: `astro check` 0 errors / 0 warnings / 0 hints. `npm run build` succeeds; `dist/learn/01-what-is-an-agent/index.html`, `dist/learn/02-agent-anatomy/index.html`, `dist/learn/03-foundations-check/index.html`, `dist/learn/index.html` exist. (No `patterns` module → no empty-module throw; `04-tool-use` gone → no unknown-module throw.)

- [ ] **Step 4: Commit**

```bash
git add src/content/modules.ts
git commit -m "feat(content): reduce modules to Foundations; defer tool-use lesson"
```

---

### Task 2: Renumber the two existing keepers to their final orders/slugs

Move `02-agent-anatomy` → order 4 and `03-foundations-check` → order 5 (frees orders 2 and 3 for the new interactive lessons) and bring both to the spec's quality bar. Orders after this task: 1, 4, 5 — unique → build green.

**Files:**
- Rename + rewrite: `src/content/lessons/02-agent-anatomy.mdx` → `src/content/lessons/04-agent-anatomy.mdx`
- Rename + rewrite: `src/content/lessons/03-foundations-check.mdx` → `src/content/lessons/05-foundations-check.mdx`

- [ ] **Step 1: Rename the files (preserve history)**

```bash
git mv src/content/lessons/02-agent-anatomy.mdx src/content/lessons/04-agent-anatomy.mdx
git mv src/content/lessons/03-foundations-check.mdx src/content/lessons/05-foundations-check.mdx
```

- [ ] **Step 2: Replace `src/content/lessons/04-agent-anatomy.mdx` entirely**

```mdx
---
title: "Anatomy of an Agent"
moduleId: "foundations"
order: 4
type: "reading"
summary: "Perception, policy, action, and memory — the four separable parts."
estMinutes: 7
---

**Objective:** name the four parts every agent has and know why keeping
them separable is the first engineering best practice.

Every agent, however simple, has four moving parts:

- **Perception** — turn the environment into an observation the policy can use.
- **Policy** — decide the next action from that observation (the model, or a mock).
- **Action** — affect the world: a tool call, an answer, a step.
- **Memory** — carry state across loop iterations.

In the loop you built, perception was "take the next observation", the
policy was `decide` / the mock LLM, the action was the printed result, and
memory was implicit (none yet). Later modules expand each part: tools
(action), retrieval and state (memory), planning (policy).

> **Best practice:** keep these four as separable units with narrow
> interfaces. You can then test the policy without a real environment,
> swap perception or tools without rewriting the loop, and reason about
> failures one part at a time. Tangling them is the most common reason an
> agent codebase becomes untestable.

Next: a short knowledge check to close out Foundations.
```

- [ ] **Step 3: Replace `src/content/lessons/05-foundations-check.mdx` entirely**

```mdx
---
title: "Foundations Check"
moduleId: "foundations"
order: 5
type: "quiz"
summary: "Quick knowledge check on the agent loop and its parts."
estMinutes: 4
---

A knowledge check for the Foundations module. The interactive quiz engine
is coming soon; review the loop, the mock-LLM idea, and the four agent
parts, then mark this complete when you are confident.
```

(The body is intentionally short — `LessonLayout` suppresses a quiz
lesson's body and renders `QuizStub` instead; this text is the authoring
fallback only.)

- [ ] **Step 4: Verify gates green**

```bash
npx astro check
npm run build
```
Expected: 0/0/0; build succeeds; `dist/learn/04-agent-anatomy/index.html` and `dist/learn/05-foundations-check/index.html` exist; orders are 1, 4, 5 (unique).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(content): renumber + upgrade anatomy (o4) and foundations-check (o5)"
```

---

### Task 3: Rewrite lesson 1 as a reading lesson (slug preserved)

`01-what-is-an-agent` becomes a reading lesson covering the roadmap, how
the hands-on works, and the core definition. The PyRunner moves to
lesson 2 (next task). The **slug/filename is unchanged** so the live
`/tutorials/01-what-is-an-agent` → `/learn/01-what-is-an-agent` redirect
still resolves.

**Files:**
- Rewrite: `src/content/lessons/01-what-is-an-agent.mdx`

- [ ] **Step 1: Replace `src/content/lessons/01-what-is-an-agent.mdx` entirely**

```mdx
---
title: "What Is an Agent?"
moduleId: "foundations"
order: 1
type: "reading"
summary: "What this track covers, how the hands-on works, and what an agent actually is."
estMinutes: 8
---

**Objective:** understand what this track teaches, how the in-browser
exercises work, and the one definition the rest of the curriculum builds on.

## What this track covers

A job-ready path for software engineers becoming AI engineers who ship
agentic systems. It is deliberately framework-agnostic: you learn the
mechanics that stay true across SDKs and model versions. The full map:

1. **Foundations** — the agent loop and the mock-LLM harness *(you are here)*
2. Prompting & Control
3. Tool Use
4. Retrieval & RAG
5. Memory & State
6. Planning & Reasoning
7. Multi-Agent Systems
8. Evaluation & Testing
9. Guardrails & Safety
10. Cost, Latency & Reliability
11. Observability & Debugging
12. Production & Deployment

## How the hands-on works

Interactive lessons run **real Python in your browser** — no install, no
keys, no cost — so you can focus on mechanics. Each agent's policy is a
**deterministic mock LLM** you control: the same interface as a real
model, fully reproducible. Calling real model APIs and frameworks is a
production concern covered later; the *patterns* you learn here are
identical either way.

## What an agent is

An **agent** is a system that repeatedly **perceives** its environment,
**decides** what to do, and **acts** — then observes the result and loops
again. The decision step is where a model (here, a mock) acts as the
**policy**.

Internalize this distinction: a plain LLM call is a single function
`prompt -> text`. An agent is a *loop* that calls a policy repeatedly,
feeds results back in, and stops on a goal or a budget. Tools, memory,
planning, multi-agent — every later topic is a refinement of that loop.

> **Best practice:** treat the policy as a swappable dependency from day
> one. If your loop only knows "call `policy(observation)`", you can test
> it with a mock today and drop in a real model later with no rewrite.

Next: **The Agent Loop** — build this loop in Python and run it.
```

- [ ] **Step 2: Verify gates green**

```bash
npx astro check
npm run build
```
Expected: 0/0/0; build succeeds; `dist/learn/01-what-is-an-agent/index.html` exists and contains "What Is an Agent". (Orders still 1, 4, 5.)

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/01-what-is-an-agent.mdx
git commit -m "feat(content): rewrite lesson 1 as reading (roadmap + definition)"
```

---

### Task 4: Create the interactive Agent Loop lesson (e2e PyRunner anchor)

Order 2. The Python is the **proven sample** currently shipping (verified
to run in Pyodide and produce the exact asserted output) — reused verbatim
so the e2e PyRunner assertion stays known-good. Orders after: 1, 2, 4, 5.

**Files:**
- Create: `src/content/lessons/02-the-agent-loop.mdx`

- [ ] **Step 1: Create `src/content/lessons/02-the-agent-loop.mdx`**

````mdx
---
title: "The Agent Loop"
moduleId: "foundations"
order: 2
type: "interactive"
summary: "Build and run the perceive–decide–act loop in pure Python."
estMinutes: 10
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** implement the perceive–decide–act loop and watch a policy
drive actions from observations.

The loop is the whole game. `decide` is the **policy** — here a trivial
hardcoded rule. `agent_loop` is **perception + action**: it walks
observations, asks the policy for an action, and reports it. Edit the code
and press **Run** — this is real Python in your browser.

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

`decide` is just `observation -> action`. That signature is the seam:
keep it and you can replace the hardcoded rule with a model.

> **Best practice:** never inline the decision into the loop. A named
> `policy(observation) -> action` boundary is what makes the agent
> testable and the model swappable.

Next: **The Mock LLM** — replace the hardcoded rule with a controllable
fake model.
````

- [ ] **Step 2: Verify gates green + the page builds with the island**

```bash
npx astro check
npm run build
test -f dist/learn/02-the-agent-loop/index.html && grep -q 'client="visible"' dist/learn/02-the-agent-loop/index.html && echo ISLAND_OK
```
Expected: 0/0/0; build succeeds; prints `ISLAND_OK` (orders 1, 2, 4, 5 — unique).

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/02-the-agent-loop.mdx
git commit -m "feat(content): add interactive Agent Loop lesson (e2e PyRunner anchor)"
```

---

### Task 5: Create the interactive Mock LLM lesson

Order 3. Deterministic, stdlib-only. The Python is authored with 4-space
indentation; MDX normalizes the `code` template literal to 2-space (and
nested 8→6) — the nesting here is shallow and stays valid Python after
normalization. Output is deterministic (not e2e-asserted; it only needs to
run). Orders after: 1, 2, 3, 4, 5 — the full module.

**Files:**
- Create: `src/content/lessons/03-the-mock-llm.mdx`

- [ ] **Step 1: Create `src/content/lessons/03-the-mock-llm.mdx`**

````mdx
---
title: "The Mock LLM"
moduleId: "foundations"
order: 3
type: "interactive"
summary: "Swap the hardcoded policy for a deterministic mock LLM you control."
estMinutes: 10
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** make the policy a **mock LLM** — a deterministic
`prompt -> response` you fully control — so you can learn agent mechanics
without keys, cost, or flakiness.

A real LLM is just `prompt -> text`. For learning, a dictionary-backed
mock gives the same interface with none of the nondeterminism. Every later
module reuses exactly this seam; only the implementation behind it changes
when real models arrive.

This is the same `policy(observation) -> action` seam from the previous
lesson, just named for the LLM's perspective: the `observation` is the
prompt you hand the model, and the `action` is the response it returns.

<PyRunner client:visible code={`class MockLLM:
    def __init__(self, table):
        self.table = table

    def __call__(self, prompt):
        return self.table.get(prompt, "answer:i_dont_know")

policy = MockLLM({
    "weather in nyc?": "tool:get_weather",
    "say hi": "answer:hello",
})

def agent_step(prompt, llm):
    decision = llm(prompt)
    print(f"prompt={prompt!r} -> {decision!r}")

for p in ["weather in nyc?", "say hi", "unknown request"]:
    agent_step(p, policy)
`} />

The agent code never changes when you go from this mock to a real model —
it still just calls `policy(prompt)`. That is the entire point of the seam.

> **Best practice:** write every agent against a policy interface, then
> develop and test against a deterministic mock. Real-model wiring becomes
> a one-line swap, and your tests stay fast and reproducible.

Next: **Anatomy of an Agent** — name the parts you just used.
````

- [ ] **Step 2: Verify gates green**

```bash
npx astro check
npm run build
test -f dist/learn/03-the-mock-llm/index.html && echo OK
```
Expected: 0/0/0; build succeeds; prints `OK`. Full module now: orders 1,2,3,4,5 unique, all `moduleId: "foundations"`.

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/03-the-mock-llm.mdx
git commit -m "feat(content): add interactive Mock LLM lesson"
```

---

### Task 6: Update e2e for the new lessons; run all gates

Rewrite `e2e/site.spec.ts` for the Foundations lessons, keeping every test
meaningful and not weakened. Then run the full gate set.

**Files:**
- Rewrite: `e2e/site.spec.ts`

- [ ] **Step 1: Replace `e2e/site.spec.ts` entirely**

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
  test("syllabus shows the Foundations module and its lessons", async ({ page }) => {
    await page.goto("/learn");
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { level: 2, name: "Foundations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /What Is an Agent\?/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /The Mock LLM/ }),
    ).toBeVisible();
  });

  test("prev/next navigates between lessons", async ({ page }) => {
    await page.goto("/learn/01-what-is-an-agent");
    await page.getByRole("link", { name: /The Agent Loop →/ }).click();
    await expect(page).toHaveURL(/\/learn\/02-the-agent-loop$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "The Agent Loop" }),
    ).toBeVisible();
  });

  test("mark complete persists across reload", async ({ page }) => {
    await page.goto("/learn/04-agent-anatomy");
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
    await page.goto("/learn/05-foundations-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
  });

  test("interactive lesson runs Python in-browser", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/learn/02-the-agent-loop");
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

- [ ] **Step 2: Run the full gate set**

```bash
npm test
npx astro check
npm run build
```
Expected: `npm test` 15 passed (unchanged — no logic touched); `astro check` 0/0/0; `npm run build` succeeds with `dist/learn/01-what-is-an-agent`, `02-the-agent-loop`, `03-the-mock-llm`, `04-agent-anatomy`, `05-foundations-check`, and `dist/learn/index.html`.

- [ ] **Step 3: Run the authoritative networked e2e**

Run: `CI=1 npx playwright test --reporter=list`
Expected: 7/7 pass, including `interactive lesson runs Python in-browser` (asserts the real Pyodide output of `02-the-agent-loop`) and the `/tutorials/01-what-is-an-agent` redirect. (Run where the Pyodide CDN is reachable; the interactive test fails honestly if it is not.)

- [ ] **Step 4: Commit**

```bash
git add e2e/site.spec.ts
git commit -m "test(e2e): update suite for Foundations module lessons"
```

---

## Self-Review

**Spec coverage:**
- Full 12-module map authored as the authoritative outline → it lives in
  the spec; lesson `01-what-is-an-agent` narrates it to learners (Task 3) ✓
- `modules.ts` = Foundations only; `patterns` + `04-tool-use` removed →
  Task 1 ✓
- Module 1 = 5 lessons (2 reading, 2 interactive, 1 quiz) with the slugs/
  orders/types from the spec table → Tasks 2–5 ✓
- `MockLLM` harness introduced as the reusable seam → Task 5 (lesson 3) ✓
- Slug `01-what-is-an-agent` preserved for redirect continuity → Task 3 ✓
- Content conventions (objective, ~6–12 min, best-practice callout,
  forward link, stdlib-only deterministic interactive, indentation-safe)
  → applied in every lesson body in Tasks 2–5 ✓
- e2e updated, kept meaningful, PyRunner anchor = `02-the-agent-loop`
  with the proven deterministic output; redirect test preserved → Task 6 ✓
- Unit tests unchanged (no logic) → noted in Task 6 ✓
- Out of scope respected: no modules 2–12 content, no D/C/A work, no
  framework/code change ✓

**Placeholder scan:** No TBD/TODO. Every MDX file and the e2e file is given
in full. Quiz body brevity is intentional and explained (LessonLayout
suppresses it).

**Type/consistency:** All lessons use `moduleId: "foundations"`; orders are
unique at every commit (Task1: 1,2,3 → Task2: 1,4,5 → Task4: 1,2,4,5 →
Task5: 1,2,3,4,5); the e2e PyRunner code/output in Task 6 exactly matches
the `02-the-agent-loop` code authored in Task 4 (the proven existing
sample); lesson titles used in e2e ("Foundations", "What Is an Agent?",
"The Mock LLM", "The Agent Loop →") exactly match the frontmatter `title`
fields; the redirect target `/learn/01-what-is-an-agent` exists because
the slug is preserved.

No gaps.
