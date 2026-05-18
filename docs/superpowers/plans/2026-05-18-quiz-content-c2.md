# Quiz Content Cycle 2 (Subsystem C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author real 5-question knowledge-check quizzes for all 11 remaining module checks (modules 2–12), completing the curriculum's quiz coverage, with no engine/schema/UI change.

**Architecture:** Each quiz is additive `questions:` frontmatter in its existing `*-check.mdx`, validated at `npm run build` by the already-shipped `quizQuestionSchema`. A new Vitest content-guard asserts every quiz lesson has ≥5 schema-valid questions; the obsolete "un-authored check" e2e is replaced by one all-correct e2e on a representative new quiz.

**Tech Stack:** Astro 6 content collections, Zod (`quizQuestionSchema`, shipped), Vitest, `yaml` (devDependency, added in Task 12), Playwright.

**Spec:** `docs/superpowers/specs/2026-05-18-quiz-content-c2-design.md`

---

## AUTHORING CONTRACT — applies to every Task 1–11

Each Task 1–11 **replaces its `*-check.mdx` file entirely** with: the
**unchanged** frontmatter scalar fields + an added `questions:` array +
the standard body paragraph. Concretely:

1. **Preserve byte-for-byte** the file's existing `title`, `moduleId`,
   `order`, `type: "quiz"`, `summary`, `estMinutes` frontmatter values
   (read them from the current file; do not invent or alter them). The
   filename/slug never changes.
2. **Add a `questions:` frontmatter array of exactly 5 questions**, each:
   - `prompt`: a non-blank question string.
   - `options`: exactly 4 non-blank strings, **plain ASCII only** (no
     unicode arrows/em-dashes/smart quotes — keeps e2e locators robust),
     each a distinct plausible answer.
   - `answerIndex`: integer `0..3`, the index of the single correct
     option. **Vary the correct index across the 5 questions** (do not
     put the answer at the same position every time; use a mix).
   - `explanation`: one or two sentences that *justify why the key is
     correct* (and ideally why the misconception fails) — not a restate
     of the option text.
3. **Body** (after the closing `---`), exactly this single paragraph with
   `{MODULE}` replaced by the module's display title:

   ```
   A knowledge check for the {MODULE} module. Answer every question,
   then submit to see your score and an explanation for each. Score 70%
   or higher to mark this lesson complete; you can retry as many times
   as you like.
   ```
4. **Source the content strictly** from that module's three content
   lessons (the task lists the exact three lesson file paths). Read all
   three fully first. Questions must test load-bearing ideas those
   lessons actually teach, using their terminology.
5. **Quality bar** (the content-correctness reviewer enforces this, the
   same gate that reviewed the Foundations Check): every marked answer
   unambiguously correct; every distractor unambiguously wrong and
   targeting a real misconception from the lessons (not throwaway); no
   two options overlapping or both-defensible; explanations accurate.
6. File ends with a trailing newline. Trailing-period / wording
   conventions follow the existing curriculum style.

**Canonical format template — the already-merged Foundations Check
(`src/content/lessons/05-foundations-check.mdx`), reproduce this exact
YAML shape and indentation:**

```mdx
---
title: "Foundations Check"
moduleId: "foundations"
order: 5
type: "quiz"
summary: "Quick knowledge check on the agent loop and its parts."
estMinutes: 4
questions:
  - prompt: "What is the agent loop?"
    options:
      - "A Python for-loop with no model"
      - "Perceive, then decide, then act, repeated each step"
      - "A cache of previous LLM responses"
      - "The transformer attention mechanism"
    answerIndex: 1
    explanation: "The loop is perceive, decide (the policy), then act, repeated each step. It is the whole game."
  - prompt: "Why develop against a deterministic mock LLM first?"
    options:
      - "Reproducible, free runs with no API keys or flakiness"
      - "Mocks answer more accurately than real models"
      - "It removes the need for an agent loop"
      - "Mocks can call external tools automatically"
    answerIndex: 0
    explanation: "A mock gives the same prompt-to-response interface deterministically, so you learn mechanics without cost or nondeterminism."
  - prompt: "In the seam policy(observation) -> action, what does the policy do?"
    options:
      - "Persists progress to local storage"
      - "Renders the lesson page"
      - "Chooses the next action from the observation"
      - "Downloads the Python runtime"
    answerIndex: 2
    explanation: "The policy maps an observation to the next action. It is the swappable decision-maker, whether a mock or a real model."
  - prompt: "What are the four separable parts of an agent?"
    options:
      - "Tokens, weights, prompts, embeddings"
      - "Perception, policy, action, memory"
      - "Input, output, cache, log"
      - "Plan, tool, retry, score"
    answerIndex: 1
    explanation: "Every agent has perception, policy, action, and memory. Keeping them separable is the first engineering best practice."
  - prompt: "When you replace the mock with a real model, what stays the same?"
    options:
      - "The agent loop and the policy interface"
      - "Nothing; the loop is rewritten"
      - "The provider API key"
      - "Only the print format"
    answerIndex: 0
    explanation: "The agent code calls policy(...) either way; only what is behind the seam changes. That is the point of the seam."
---

A knowledge check for the Foundations module. Answer every question, then
submit to see your score and an explanation for each. Score 70% or higher
to mark this lesson complete; you can retry as many times as you like.
```

**Per-task verification (the "tests" for Tasks 1–11):**
- `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx astro check` → 0 errors / 0 warnings / 0 hints.
- `npm run build` → green, **51 pages** (the content collection runs `quizQuestionSchema` over the new 5 questions; an out-of-range `answerIndex`, <2 options, or blank string fails the build with a Zod path — that is the integrity gate).
- `npx vitest run` → all existing suites still green (no logic touched).
- Then the controller runs the two-stage review: spec-compliance (frontmatter scalars unchanged, exactly 5 questions, schema-valid, ASCII options, varied answerIndex, standard body) **and** content-correctness (every question cross-checked against the three source lessons).
- Commit (one file): `git add <file> && git commit -m "content(c): author <Module> check quiz"`.

---

### Task 0: Branch

- [ ] **Step 1:** `git rev-parse --abbrev-ref HEAD` → expect `quiz-content-c2`. If not, `git checkout quiz-content-c2`. Never author on `main`.

---

### Task 1: Prompting & Control Check

**File:** `src/content/lessons/09-prompting-check.mdx`
**Module display title:** `Prompting & Control`
**Source lessons (read all three fully):**
- `src/content/lessons/06-controlling-the-policy.mdx`
- `src/content/lessons/07-structured-output.mdx`
- `src/content/lessons/08-prompting-pitfalls.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/09-prompting-check.mdx` entirely per the AUTHORING CONTRACT (preserve its existing frontmatter scalars: `title: "Prompting & Control Check"`, `moduleId: "prompting"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; add 5 questions; body uses `{MODULE}` = `Prompting & Control`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/09-prompting-check.mdx && git commit -m "content(c): author Prompting & Control check quiz"`

---

### Task 2: Tool Use Check  (e2e-coupled — see note)

**File:** `src/content/lessons/13-tools-check.mdx`
**Module display title:** `Tool Use`
**Source lessons (read all three fully):**
- `src/content/lessons/10-what-is-a-tool.mdx`
- `src/content/lessons/11-a-tool-using-loop.mdx`
- `src/content/lessons/12-tool-errors-and-retries.mdx`

> **e2e coupling:** Task 13 adds an all-correct Playwright test for this
> quiz. Its option strings MUST be plain ASCII (already required by the
> contract) and each question's correct option text must be unique on
> the page. Do not weaken this; Task 13 derives the correct strings from
> the committed file.

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/13-tools-check.mdx` entirely per the AUTHORING CONTRACT (preserve existing scalars: `title: "Tool Use Check"`, `moduleId: "tools"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; 5 questions; body `{MODULE}` = `Tool Use`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/13-tools-check.mdx && git commit -m "content(c): author Tool Use check quiz"`

---

### Task 3: Retrieval & RAG Check

**File:** `src/content/lessons/17-rag-check.mdx`
**Module display title:** `Retrieval & RAG`
**Source lessons (read all three fully):**
- `src/content/lessons/14-grounding-and-rag.mdx`
- `src/content/lessons/15-a-tiny-retriever.mdx`
- `src/content/lessons/16-rag-failure-modes.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/17-rag-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Retrieval & RAG Check"`, `moduleId: "rag"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Retrieval & RAG`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/17-rag-check.mdx && git commit -m "content(c): author Retrieval & RAG check quiz"`

---

### Task 4: Memory & State Check

**File:** `src/content/lessons/21-memory-check.mdx`
**Module display title:** `Memory & State`
**Source lessons (read all three fully):**
- `src/content/lessons/18-why-agents-need-memory.mdx`
- `src/content/lessons/19-conversation-memory.mdx`
- `src/content/lessons/20-memory-pitfalls.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/21-memory-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Memory & State Check"`, `moduleId: "memory"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Memory & State`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/21-memory-check.mdx && git commit -m "content(c): author Memory & State check quiz"`

---

### Task 5: Planning & Reasoning Check

**File:** `src/content/lessons/25-planning-check.mdx`
**Module display title:** `Planning & Reasoning`
**Source lessons (read all three fully):**
- `src/content/lessons/22-decompose-then-act.mdx`
- `src/content/lessons/23-a-plan-execute-loop.mdx`
- `src/content/lessons/24-reflection-and-limits.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/25-planning-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Planning & Reasoning Check"`, `moduleId: "planning"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Planning & Reasoning`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/25-planning-check.mdx && git commit -m "content(c): author Planning & Reasoning check quiz"`

---

### Task 6: Multi-Agent Systems Check

**File:** `src/content/lessons/29-multi-agent-check.mdx`
**Module display title:** `Multi-Agent Systems`
**Source lessons (read all three fully):**
- `src/content/lessons/26-when-multiple-agents.mdx`
- `src/content/lessons/27-supervisor-and-workers.mdx`
- `src/content/lessons/28-coordination-failures.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/29-multi-agent-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Multi-Agent Systems Check"`, `moduleId: "multi-agent"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Multi-Agent Systems`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/29-multi-agent-check.mdx && git commit -m "content(c): author Multi-Agent Systems check quiz"`

---

### Task 7: Evaluation & Testing Check

**File:** `src/content/lessons/33-evaluation-check.mdx`
**Module display title:** `Evaluation & Testing`
**Source lessons (read all three fully):**
- `src/content/lessons/30-how-to-measure-an-agent.mdx`
- `src/content/lessons/31-an-eval-harness.mdx`
- `src/content/lessons/32-evaluation-pitfalls.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/33-evaluation-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Evaluation & Testing Check"`, `moduleId: "evaluation"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Evaluation & Testing`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/33-evaluation-check.mdx && git commit -m "content(c): author Evaluation & Testing check quiz"`

---

### Task 8: Guardrails & Safety Check

**File:** `src/content/lessons/37-guardrails-check.mdx`
**Module display title:** `Guardrails & Safety`
**Source lessons (read all three fully):**
- `src/content/lessons/34-input-output-guardrails.mdx`
- `src/content/lessons/35-a-guardrail-layer.mdx`
- `src/content/lessons/36-injection-and-safe-tools.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/37-guardrails-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Guardrails & Safety Check"`, `moduleId: "guardrails"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Guardrails & Safety`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/37-guardrails-check.mdx && git commit -m "content(c): author Guardrails & Safety check quiz"`

---

### Task 9: Cost, Latency & Reliability Check

**File:** `src/content/lessons/41-reliability-check.mdx`
**Module display title:** `Cost, Latency & Reliability`
**Source lessons (read all three fully):**
- `src/content/lessons/38-budgets-and-caching.mdx`
- `src/content/lessons/39-caching-and-budgets.mdx`
- `src/content/lessons/40-timeouts-retries-fallback.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/41-reliability-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Cost, Latency & Reliability Check"`, `moduleId: "reliability"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Cost, Latency & Reliability`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/41-reliability-check.mdx && git commit -m "content(c): author Cost, Latency & Reliability check quiz"`

---

### Task 10: Observability & Debugging Check

**File:** `src/content/lessons/45-observability-check.mdx`
**Module display title:** `Observability & Debugging`
**Source lessons (read all three fully):**
- `src/content/lessons/42-tracing-the-loop.mdx`
- `src/content/lessons/43-a-trace-recorder.mdx`
- `src/content/lessons/44-debugging-from-traces.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/45-observability-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Observability & Debugging Check"`, `moduleId: "observability"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Observability & Debugging`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/45-observability-check.mdx && git commit -m "content(c): author Observability & Debugging check quiz"`

---

### Task 11: Production & Deployment Check

**File:** `src/content/lessons/49-production-check.mdx`
**Module display title:** `Production & Deployment`
**Source lessons (read all three fully):**
- `src/content/lessons/46-shipping-an-agent.mdx`
- `src/content/lessons/47-a-production-handler.mdx`
- `src/content/lessons/48-going-further.mdx`

- [ ] **Step 1:** Read the three source lessons.
- [ ] **Step 2:** Replace `src/content/lessons/49-production-check.mdx` entirely per the AUTHORING CONTRACT (preserve scalars: `title: "Production & Deployment Check"`, `moduleId: "production"`, `order: 4`, `type: "quiz"`, `summary` as-is, `estMinutes: 4`; body `{MODULE}` = `Production & Deployment`).
- [ ] **Step 3:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages; `npx vitest run` → unchanged green.
- [ ] **Step 4:** `git add src/content/lessons/49-production-check.mdx && git commit -m "content(c): author Production & Deployment check quiz"`

---

### Task 12: Vitest content-guard (all 12 quizzes ≥5 schema-valid questions)

**Files:**
- Modify: `package.json` (add `yaml` devDependency)
- Create: `tests/quiz-content.test.ts`

- [ ] **Step 1: Add the `yaml` devDependency**

Run: `npm install -D yaml@2`
Expected: `yaml` appears under `devDependencies` in `package.json`; lockfile updated. (`yaml` v2 is already in the tree as an Astro transitive dep; this makes the test's use explicit/stable.)

- [ ] **Step 2: Create `tests/quiz-content.test.ts` with EXACTLY:**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { quizQuestionSchema } from "../src/lib/quiz/schema";

const LESSONS_DIR = fileURLToPath(
  new URL("../src/content/lessons", import.meta.url),
);

function frontmatter(path: string): Record<string, unknown> {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${path}`);
  return (parse(m[1]) ?? {}) as Record<string, unknown>;
}

const quizFiles = readdirSync(LESSONS_DIR)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => `${LESSONS_DIR}/${f}`)
  .filter((p) => frontmatter(p).type === "quiz")
  .sort();

describe("quiz content", () => {
  it("there are exactly 12 quiz lessons", () => {
    expect(quizFiles.length).toBe(12);
  });

  for (const path of quizFiles) {
    const name = path.split("/").pop() as string;
    it(`${name}: >=5 schema-valid questions, answerIndex in range`, () => {
      const questions = frontmatter(path).questions;
      expect(Array.isArray(questions), `${name}: no questions array`).toBe(
        true,
      );
      const qs = questions as unknown[];
      expect(qs.length, `${name}: <5 questions`).toBeGreaterThanOrEqual(5);
      qs.forEach((q, i) => {
        const r = quizQuestionSchema.safeParse(q);
        expect(
          r.success,
          `${name} q${i} failed schema: ${JSON.stringify(q)}`,
        ).toBe(true);
      });
    });
  }
});
```

- [ ] **Step 3: Run the content-guard**

Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx vitest run tests/quiz-content.test.ts`
Expected: PASS — "exactly 12 quiz lessons" + 12 per-file cases green (Foundations from Cycle 1 plus the 11 authored in Tasks 1–11). If any per-file case fails, the named quiz violates the schema/≥5 rule — fix that quiz's frontmatter (do not weaken the test).

- [ ] **Step 4: Full unit suite + typecheck**

Run: `npx vitest run && npx astro check`
Expected: all suites green (existing + the new file); `astro check` 0/0/0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/quiz-content.test.ts
git commit -m "test(c): content-guard — every quiz has >=5 schema-valid questions"
```

---

### Task 13: e2e — drop the obsolete empty-state test, add a representative all-correct test

**Files:** Modify `e2e/site.spec.ts`

- [ ] **Step 1: Remove the now-obsolete test**

Delete exactly this test block from `e2e/site.spec.ts` (inside `test.describe("curriculum", ...)`):
```ts
  test("quiz: an un-authored check shows the review note", async ({ page }) => {
    await page.goto("/learn/09-prompting-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
    await expect(
      page.getByRole("button", { name: "Submit" }),
    ).toHaveCount(0);
  });
```
(After Cycle 2 no un-authored check exists, so this scenario is gone; the empty-state branch is now guarded by `tests/quiz-content.test.ts` asserting every quiz has questions. Do not modify any other existing test, including the Foundations all-correct test and the live-Pyodide interactive test.)

- [ ] **Step 2: Derive the 5 correct option strings for `13-tools-check`**

Open the committed `src/content/lessons/13-tools-check.mdx`. For each of its 5 questions in order, take `options[answerIndex]` — the exact correct option string (ASCII, guaranteed by the authoring contract). Call these S1..S5. Confirm each Sn is unique among that question's options and that no Sn is a substring of another option in the same question (it won't be if the contract was followed; if it is, that's a Task 2 content defect — report it, do not work around it in the test).

- [ ] **Step 3: Append this test inside the `test.describe("curriculum", ...)` block** (after the Foundations all-correct test, before the describe's closing `});`), substituting the five literal strings S1..S5 derived in Step 2:

```ts
  test("quiz: Tool Use all-correct submission passes and completes", async ({
    page,
  }) => {
    await page.goto("/learn/13-tools-check");
    await expect(
      page.getByRole("button", { name: /Mark complete/i }),
    ).toBeVisible();
    for (const name of [
      "S1", // ← replace with the literal options[answerIndex] of question 1
      "S2", // ← question 2
      "S3", // ← question 3
      "S4", // ← question 4
      "S5", // ← question 5
    ]) {
      await page.getByRole("radio", { name, exact: true }).check();
    }
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("status")).toContainText("You scored 5 / 5");
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
  });
```
(The five-string array MUST be the actual S1..S5 literals — no `S1` placeholders left. This mirrors the proven Foundations test: precondition not-complete, answer all correct, score 5/5, completes, persists across reload while the in-memory quiz state resets.)

- [ ] **Step 4: Full non-networked gates**

Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npm test && npx astro check && npm run build`
Expected: `npm test` all green (incl. `quiz-content` 13 cases); `astro check` 0/0/0; `npm run build` green, 51 pages.

- [ ] **Step 5: Authoritative networked e2e (MANDATORY gate)**

The suite includes the live-Pyodide interactive anchor needing `cdn.jsdelivr.net`; the Bash sandbox blocks network, so run with the Bash tool's `dangerouslyDisableSandbox: true`:
```
CI=1 npx playwright test --reporter=list
```
Expected: **all pass** — the originals minus the removed empty-state test, plus the new Tool Use all-correct test (so the same count as before: 10). Specifically green: landing, syllabus, prev/next, mark-complete, the Foundations quiz all-correct, the new Tool Use quiz all-correct, the live-Pyodide interactive anchor, both model-settings tests, the redirect. If ONLY `interactive lesson runs Python in-browser` fails with a network/CDN/timeout to `cdn.jsdelivr.net`, retry once; if still only that and only environmental, report DONE_WITH_CONCERNS with the exact output and confirm all others passed. Any assertion/locator failure (esp. the new Tool Use test) is a real defect — fix the quiz content or the derived strings, never weaken the test.

- [ ] **Step 6: Commit**

```bash
git add e2e/site.spec.ts
git commit -m "test(e2e): drop obsolete empty-state test; add Tool Use all-correct quiz test"
```

---

## Self-Review

**Spec coverage:**
- 5 single-answer MC per quiz, all 11 checks, one cycle/branch → Tasks 1–11 (one per check, AUTHORING CONTRACT pins 5 + schema) ✓
- Sourcing strictly from each module's 3 lessons → every Task 1–11 lists the exact 3 lesson paths + Step 1 "read all three" ✓
- Quality bar enforced by per-quiz content-correctness review → AUTHORING CONTRACT §5 + per-task verification's two-stage review ✓
- Standard module-named body prose → CONTRACT §3 with `{MODULE}` and each task's display title ✓
- Frontmatter invariants (scalars/slug unchanged, additive only) → CONTRACT §1 + each task names the exact scalars to preserve ✓
- Engine/schema/threshold/UI unchanged → no task touches `src/`; only `*-check.mdx`, a new test, `package.json`, `e2e` ✓
- Vitest content-guard (≥5 schema-valid, all 12) → Task 12 (full code, reuses `quizQuestionSchema`, `yaml` devDep) ✓
- Remove obsolete empty-state e2e; keep Foundations; add one representative (`13-tools-check`) all-correct → Task 13 ✓
- Build Zod-validates 60 questions; slugs/order/type unchanged → per-task `npm run build` 51 pages; CONTRACT §1 ✓
- DoD: npm test (+new), astro 0/0/0, build 51, networked e2e → Tasks' verification + Task 13 Steps 4–5 ✓
- Out of scope respected: no new question types, no engine, no non-quiz content edits, no A/D2/CI ✓

**Placeholder scan:** The only intentional substitution is Task 13's S1..S5, which is a *deterministic derivation* with an exact rule (read `13-tools-check.mdx`, take `options[answerIndex]` per question) and an explicit "no `S1` placeholders left" gate — not a vague TODO. Tasks 1–11 deliberately do not pre-write the 55 questions: authoring requires reading each module's three lessons and is the implementer's reviewed deliverable (the controller's content-correctness review is the acceptance gate, mirroring Cycle 1's Foundations Check review). All formats, schema rules, the verbatim template, the exact body sentence, exact file paths, exact source-lesson paths, and exact commands are fully specified — no hand-waving of *how*.

**Type/consistency:** `quizQuestionSchema` is the shipped schema (`src/lib/quiz/schema.ts`), imported (not reimplemented) by Task 12. The frontmatter shape exactly matches the merged Foundations Check template. The content-guard's quiz-detection (`frontmatter().type === "quiz"`) matches the collection schema's `type` enum. Task 13's removed block is quoted verbatim from the current `e2e/site.spec.ts`; the added test mirrors the existing Foundations all-correct test's structure (same locators/assertions). Module display titles match `src/content/modules.ts` `title` fields exactly.

No gaps.
