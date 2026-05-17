# Quiz Engine (Subsystem C, Cycle 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `QuizStub` "coming soon" placeholder with a real, deterministic, in-browser multiple-choice quiz engine; author the Foundations Check end-to-end while the other 11 module checks render a graceful empty state.

**Architecture:** Three isolated units — a pure unit-tested grader (`src/lib/quiz/grade.ts`), a Zod question schema in a testable seam (`src/lib/quiz/schema.ts`) wired into the content collection, and a React island (`src/components/Quiz.tsx`) that replaces `QuizStub`. Quiz questions are authored in the check lesson's frontmatter; a passing submission (≥70%) marks the lesson complete through the existing synchronous `ProgressStore` seam. No backend, no new persisted state.

**Tech Stack:** Astro 6 (static, content collections, Zod), React 19 islands, Tailwind v4, Vitest (unit), Playwright (headless e2e).

**Spec:** `docs/superpowers/specs/2026-05-17-quiz-engine-design.md`

---

## File Structure

- **Create** `src/lib/quiz/grade.ts` — pure grader: `QuizQuestion`/`QuizResult` types, `PASS_RATIO`, `gradeQuiz()`. No React, no DOM.
- **Create** `src/lib/quiz/schema.ts` — `quizQuestionSchema` (Zod, with per-question `answerIndex`-in-range refinement). Importable by both content config and unit tests.
- **Create** `tests/quiz-grade.test.ts` — unit tests for `gradeQuiz`.
- **Create** `tests/quiz-schema.test.ts` — unit tests for `quizQuestionSchema`.
- **Create** `src/components/Quiz.tsx` — the quiz island (renders questions, submit/grade/retry, empty-state review note); replaces `QuizStub`.
- **Delete** `src/components/QuizStub.tsx` — its copy lives on as `Quiz`'s empty state.
- **Modify** `src/content.config.ts` — add optional `questions` to the lessons schema.
- **Modify** `src/lib/curriculum.ts` — add optional `questions` to `LessonMeta`.
- **Modify** `src/lib/toLessonMeta.ts` — carry `questions` through.
- **Modify** `tests/toLessonMeta.test.ts` — add a mapping test for `questions`.
- **Modify** `src/layouts/LessonLayout.astro` — render `<Quiz>` instead of `<QuizStub>`.
- **Modify** `src/content/lessons/05-foundations-check.mdx` — author the Foundations Check `questions`.
- **Modify** `e2e/site.spec.ts` — replace the stub test with a pass-and-complete test plus an empty-state test.

---

### Task 0: Branch

**Files:** none (branch already exists).

- [ ] **Step 1: Confirm the working branch**

Run: `git rev-parse --abbrev-ref HEAD`
Expected: `quiz-engine-c1`

If it prints anything else, run `git checkout quiz-engine-c1` (the branch was created off `main` and already has the design spec committed). Do **not** implement on `main`.

---

### Task 1: Pure grader (TDD)

**Files:**
- Create: `src/lib/quiz/grade.ts`
- Test: `tests/quiz-grade.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/quiz-grade.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { gradeQuiz, PASS_RATIO, type QuizQuestion } from "../src/lib/quiz/grade";

const q = (answerIndex: number): QuizQuestion => ({
  prompt: "p",
  options: ["a", "b", "c", "d"],
  answerIndex,
  explanation: "because",
});

describe("gradeQuiz", () => {
  it("PASS_RATIO is 0.7", () => {
    expect(PASS_RATIO).toBe(0.7);
  });

  it("all correct → passed, ratio 1, perQuestion all true", () => {
    const qs = [q(0), q(1), q(2)];
    const r = gradeQuiz(qs, [0, 1, 2]);
    expect(r).toEqual({
      correct: 3,
      total: 3,
      ratio: 1,
      passed: true,
      perQuestion: [{ correct: true }, { correct: true }, { correct: true }],
    });
  });

  it("all wrong → not passed, ratio 0", () => {
    const qs = [q(0), q(1)];
    const r = gradeQuiz(qs, [1, 0]);
    expect(r.correct).toBe(0);
    expect(r.ratio).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("exactly 70% → passed (boundary, inclusive)", () => {
    const qs = Array.from({ length: 10 }, () => q(0));
    const answers = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]; // 7/10
    const r = gradeQuiz(qs, answers);
    expect(r.correct).toBe(7);
    expect(r.ratio).toBeCloseTo(0.7, 10);
    expect(r.passed).toBe(true);
  });

  it("just below 70% → not passed", () => {
    const qs = Array.from({ length: 10 }, () => q(0));
    const answers = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]; // 6/10
    const r = gradeQuiz(qs, answers);
    expect(r.correct).toBe(6);
    expect(r.passed).toBe(false);
  });

  it("unanswered (null) counts as wrong", () => {
    const qs = [q(0), q(1)];
    const r = gradeQuiz(qs, [0, null]);
    expect(r.correct).toBe(1);
    expect(r.perQuestion).toEqual([{ correct: true }, { correct: false }]);
  });

  it("empty quiz → total 0, ratio 0, never passed", () => {
    const r = gradeQuiz([], []);
    expect(r).toEqual({
      correct: 0,
      total: 0,
      ratio: 0,
      passed: false,
      perQuestion: [],
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/quiz-grade.test.ts`
Expected: FAIL — cannot resolve `../src/lib/quiz/grade`.

- [ ] **Step 3: Implement the grader**

Create `src/lib/quiz/grade.ts`:

```ts
export const PASS_RATIO = 0.7;

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  ratio: number;
  passed: boolean;
  perQuestion: { correct: boolean }[];
}

export function gradeQuiz(
  questions: QuizQuestion[],
  answers: (number | null)[],
): QuizResult {
  const perQuestion = questions.map((question, i) => ({
    correct: answers[i] === question.answerIndex,
  }));
  const correct = perQuestion.filter((p) => p.correct).length;
  const total = questions.length;
  const ratio = total === 0 ? 0 : correct / total;
  const passed = total > 0 && ratio >= PASS_RATIO;
  return { correct, total, ratio, passed, perQuestion };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/quiz-grade.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz/grade.ts tests/quiz-grade.test.ts
git commit -m "feat(c): pure deterministic quiz grader (gradeQuiz)"
```

---

### Task 2: Quiz question schema (TDD)

**Files:**
- Create: `src/lib/quiz/schema.ts`
- Test: `tests/quiz-schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/quiz-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { quizQuestionSchema } from "../src/lib/quiz/schema";

const valid = {
  prompt: "What is the agent loop?",
  options: ["a", "b", "c"],
  answerIndex: 1,
  explanation: "Because the loop repeats.",
};

describe("quizQuestionSchema", () => {
  it("accepts a well-formed question", () => {
    expect(quizQuestionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects fewer than 2 options", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, options: ["only"] });
    expect(r.success).toBe(false);
  });

  it("rejects an empty prompt", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, prompt: "" });
    expect(r.success).toBe(false);
  });

  it("rejects an empty explanation", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, explanation: "" });
    expect(r.success).toBe(false);
  });

  it("rejects answerIndex out of range", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: 3 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(["answerIndex"]);
    }
  });

  it("rejects a negative answerIndex", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: -1 });
    expect(r.success).toBe(false);
  });

  it("accepts answerIndex at the last valid position", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: 2 });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/quiz-schema.test.ts`
Expected: FAIL — cannot resolve `../src/lib/quiz/schema`.

- [ ] **Step 3: Implement the schema**

Create `src/lib/quiz/schema.ts`:

```ts
import { z } from "zod";

export const quizQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
    explanation: z.string().min(1),
  })
  .superRefine((q, ctx) => {
    if (q.answerIndex >= q.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerIndex"],
        message: `answerIndex ${q.answerIndex} is out of range for ${q.options.length} options`,
      });
    }
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/quiz-schema.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz/schema.ts tests/quiz-schema.test.ts
git commit -m "feat(c): Zod quiz-question schema with answerIndex range check"
```

---

### Task 3: Wire schema into content + thread `questions` through `LessonMeta` (TDD)

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/lib/curriculum.ts`
- Modify: `src/lib/toLessonMeta.ts`
- Modify: `tests/toLessonMeta.test.ts`

- [ ] **Step 1: Add the failing mapping test**

In `tests/toLessonMeta.test.ts`, add this second test inside the existing `describe("toLessonMeta", () => { ... })` block (after the existing test, before the describe's closing `});`):

```ts
  it("carries a questions array through when present", () => {
    const entry = {
      id: "05-foundations-check",
      data: {
        title: "Foundations Check",
        moduleId: "foundations",
        order: 5,
        type: "quiz" as const,
        summary: "Check.",
        estMinutes: 4,
        questions: [
          {
            prompt: "Q?",
            options: ["a", "b"],
            answerIndex: 1,
            explanation: "because",
          },
        ],
      },
    };
    const meta = toLessonMeta(entry as Parameters<typeof toLessonMeta>[0]);
    expect(meta.questions).toEqual([
      { prompt: "Q?", options: ["a", "b"], answerIndex: 1, explanation: "because" },
    ]);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/toLessonMeta.test.ts`
Expected: FAIL — `meta.questions` is `undefined` (not yet mapped).

- [ ] **Step 3: Add `questions` to the content schema**

In `src/content.config.ts`, add the import after the existing `import { z } from "zod";` line:

```ts
import { quizQuestionSchema } from "./lib/quiz/schema";
```

Then add a `questions` field to the `schema: z.object({ ... })` (after `estMinutes`):

```ts
    estMinutes: z.number().int().positive(),
    questions: z.array(quizQuestionSchema).optional(),
```

(The field is optional so the 11 un-authored `*-check.mdx` lessons remain build-valid.)

- [ ] **Step 4: Add `questions` to `LessonMeta`**

In `src/lib/curriculum.ts`, add this import at the top (after the existing `import type { Module }` line):

```ts
import type { QuizQuestion } from "./quiz/grade";
```

Then add the optional field to the `LessonMeta` interface (after `estMinutes: number;`):

```ts
  estMinutes: number;
  questions?: QuizQuestion[];
```

- [ ] **Step 5: Carry `questions` through `toLessonMeta`**

In `src/lib/toLessonMeta.ts`, add `questions` to the returned object (after `estMinutes`):

```ts
    estMinutes: entry.data.estMinutes,
    questions: entry.data.questions,
```

- [ ] **Step 6: Run the unit suite + typecheck**

Run: `npx vitest run tests/toLessonMeta.test.ts`
Expected: PASS — both tests (the original still passes; `toEqual` ignores the now-present `questions: undefined` on non-quiz entries).

Run: `npx astro check`
Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/lib/curriculum.ts src/lib/toLessonMeta.ts tests/toLessonMeta.test.ts
git commit -m "feat(c): validate quiz questions in content schema, thread through LessonMeta"
```

---

### Task 4: Quiz island + layout wiring

**Files:**
- Create: `src/components/Quiz.tsx`
- Delete: `src/components/QuizStub.tsx`
- Modify: `src/layouts/LessonLayout.astro`

- [ ] **Step 1: Create the Quiz island**

Create `src/components/Quiz.tsx` with EXACTLY this content (note: all hooks are called unconditionally before the empty-state early return, satisfying the Rules of Hooks):

```tsx
import { useEffect, useRef, useState } from "react";
import { useProgress } from "../lib/progress/useProgress";
import { gradeQuiz, type QuizQuestion } from "../lib/quiz/grade";

export default function Quiz({
  slug,
  title,
  questions,
}: {
  slug: string;
  title: string;
  questions: QuizQuestion[];
}) {
  const { setComplete } = useProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);

  const result = submitted ? gradeQuiz(questions, answers) : null;

  useEffect(() => {
    if (result?.passed && !completedRef.current) {
      completedRef.current = true;
      setComplete(slug, true);
    }
  }, [result, slug, setComplete]);

  if (questions.length === 0) {
    return (
      <div
        role="note"
        aria-label={`Quiz: ${title}`}
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

  const allAnswered = answers.every((a) => a !== null);

  function choose(qi: number, oi: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
  }

  return (
    <div className="my-6 not-prose">
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const qResult = result?.perQuestion[qi];
          return (
            <li key={qi}>
              <fieldset>
                <legend className="font-semibold">{q.prompt}</legend>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`alb-q-${qi}`}
                        checked={answers[qi] === oi}
                        disabled={submitted}
                        onChange={() => choose(qi, oi)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {qResult && (
                  <p
                    className={
                      qResult.correct
                        ? "mt-2 text-sm text-green-700 dark:text-green-400"
                        : "mt-2 text-sm text-red-700 dark:text-red-400"
                    }
                  >
                    <span>
                      {qResult.correct ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                    {" — "}
                    {q.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {result ? (
        <div className="mt-6">
          <p role="status" aria-live="polite" className="font-semibold">
            You scored {result.correct} / {result.total} —{" "}
            {result.passed
              ? "passed. This lesson is marked complete."
              : "keep reviewing and try again."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded border border-gray-400 px-4 py-2 text-sm font-medium dark:border-gray-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete `QuizStub.tsx`**

Run: `git rm src/components/QuizStub.tsx`
Expected: file staged for deletion.

- [ ] **Step 3: Confirm nothing else imports QuizStub**

Run: `grep -rn "QuizStub" src/ e2e/`
Expected: only `src/layouts/LessonLayout.astro` (which the next step rewrites). If any other file references it, stop and report.

- [ ] **Step 4: Wire the layout to `<Quiz>`**

In `src/layouts/LessonLayout.astro`:

Replace the import line
```astro
import QuizStub from "../components/QuizStub.tsx";
```
with
```astro
import Quiz from "../components/Quiz.tsx";
```

Replace the quiz branch
```astro
      {lesson.type === "quiz" ? (
        <QuizStub client:load title={lesson.title} />
      ) : lesson.type === "reading" || lesson.type === "interactive" ? (
```
with
```astro
      {lesson.type === "quiz" ? (
        <Quiz
          client:load
          slug={lesson.slug}
          title={lesson.title}
          questions={lesson.questions ?? []}
        />
      ) : lesson.type === "reading" || lesson.type === "interactive" ? (
```

- [ ] **Step 5: Typecheck + build**

Run: `npx astro check && npm run build`
Expected: `astro check` 0/0/0; build green, 51 pages (all 12 `*-check.mdx` build — 11 with no `questions` render the empty state, 05 still has no `questions` until Task 5 so it also renders the empty state for now).

- [ ] **Step 6: Commit**

```bash
git add src/components/Quiz.tsx src/layouts/LessonLayout.astro
git commit -m "feat(c): Quiz island replaces QuizStub (engine + graceful empty state)"
```

---

### Task 5: Author the Foundations Check questions

**Files:**
- Modify: `src/content/lessons/05-foundations-check.mdx`

- [ ] **Step 1: Replace `src/content/lessons/05-foundations-check.mdx` ENTIRELY with:**

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

(Frontmatter `title`/`moduleId`/`order`/`type`/`estMinutes` are unchanged, so the slug `05-foundations-check`, curriculum integrity, prev/next, and the `/tutorials/` redirect all stay valid. The body prose is suppressed for `type:"quiz"` by `LessonLayout` but is updated so the file reads sensibly.)

- [ ] **Step 2: Typecheck + build (Zod validates the real content)**

Run: `npx astro check && npm run build`
Expected: `astro check` 0/0/0; build green, 51 pages. (The content collection runs `quizQuestionSchema` over these 5 questions at build; every `answerIndex` is within its `options` length, so it passes. A mistake here would fail the build with a Zod path — that is the content-integrity guard.)

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/05-foundations-check.mdx
git commit -m "feat(c): author Foundations Check quiz (5 questions)"
```

---

### Task 6: e2e — replace the stub test; full gates

**Files:**
- Modify: `e2e/site.spec.ts`

- [ ] **Step 1: Replace the stub test with two tests**

In `e2e/site.spec.ts`, find the existing test (inside `test.describe("curriculum", ...)`):

```ts
  test("quiz lesson renders the accessible stub", async ({ page }) => {
    await page.goto("/learn/05-foundations-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
  });
```

Replace that entire test block with these two tests (same location, inside the `curriculum` describe):

```ts
  test("quiz: all-correct submission passes and completes the lesson", async ({
    page,
  }) => {
    await page.goto("/learn/05-foundations-check");
    await page
      .getByRole("radio", {
        name: "Perceive, then decide, then act, repeated each step",
      })
      .check();
    await page
      .getByRole("radio", {
        name: "Reproducible, free runs with no API keys or flakiness",
      })
      .check();
    await page
      .getByRole("radio", {
        name: "Chooses the next action from the observation",
      })
      .check();
    await page
      .getByRole("radio", { name: "Perception, policy, action, memory" })
      .check();
    await page
      .getByRole("radio", { name: "The agent loop and the policy interface" })
      .check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("status")).toContainText("You scored 5 / 5");
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
  });

  test("quiz: an un-authored check shows the review note", async ({ page }) => {
    await page.goto("/learn/09-prompting-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
    await expect(
      page.getByRole("button", { name: "Submit" }),
    ).toHaveCount(0);
  });
```

(The 6 other existing tests — landing, syllabus, prev/next, mark-complete, the interactive PyRunner anchor, the redirect — stay unchanged. The all-correct option strings are exactly the correct options authored in Task 5; this test also guards that every authored `answerIndex` is correct, since a wrong index would make the score ≠ 5/5.)

- [ ] **Step 2: Full non-networked gate set**

Run: `npm test && npx astro check && npm run build`
Expected: `npm test` — all unit suites pass (curriculum, progress, toLessonMeta incl. the new questions test, quiz-grade 7, quiz-schema 7, plus any pre-existing D-unrelated suites on this branch); `astro check` 0/0/0; `npm run build` green, 51 pages.

- [ ] **Step 3: Authoritative networked e2e (MANDATORY Definition-of-Done gate)**

The suite still includes the live-Pyodide interactive-lesson anchor, which needs the Pyodide CDN (`cdn.jsdelivr.net`). Run with the Bash sandbox disabled so the CDN is reachable (`dangerouslyDisableSandbox: true`):

Run: `CI=1 npx playwright test --reporter=list`
Expected: ALL tests pass — the unchanged 6 (including the live-Pyodide anchor) plus the 2 new quiz tests (all-correct → "You scored 5 / 5" + Completed persists across reload; un-authored check → review note, no Submit button). Allow up to ~10 min for Pyodide cold-load.

Honest handling:
- All pass → proceed to commit.
- If ONLY the Pyodide anchor fails with a network/CDN/timeout error reaching `cdn.jsdelivr.net` (environmental, not an assertion), retry the exact command ONCE. If it still fails purely because the CDN is unreachable here, report DONE_WITH_CONCERNS, paste the output, and state explicitly that every non-Pyodide test (including both quiz tests) passed and the Pyodide failure is environmental, not an assertion. Do not weaken/skip any test.
- If any quiz test, or any other test, fails on an ASSERTION/locator/timeout-not-CDN → real defect: report BLOCKED with the exact failing test and error; do not modify tests to pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/site.spec.ts
git commit -m "test(e2e): quiz passes+completes the flagship; empty-state on un-authored checks"
```

---

## Self-Review

**Spec coverage:**
- Authoring in frontmatter, Zod-validated → Task 2 (schema) + Task 3 (wired into `content.config.ts`) + Task 5 (authored) ✓
- Single-answer multiple choice only → `QuizQuestion` (one `answerIndex`); radio groups in `Quiz.tsx` (Task 1, 4) ✓
- Submit-all → score + per-question explanations → `Quiz.tsx` submit/result rendering (Task 4) ✓
- Pass ≥70% → existing `setComplete` seam; retake free; never un-completes; manual button intact → `gradeQuiz` `PASS_RATIO` (Task 1) + `Quiz.tsx` `useEffect` calling `setComplete(slug,true)` once via `completedRef`; `MarkComplete` untouched (Task 4) ✓
- No new persisted state (answers in-memory, reset on reload) → `Quiz.tsx` `useState` only; e2e asserts completion (not answers) persists (Task 4, 6) ✓
- Empty/missing questions → review state, no broken UI → `Quiz.tsx` empty branch (Task 4); e2e on `09-prompting-check` (Task 6) ✓
- Malformed content fails build → `quizQuestionSchema` `.superRefine` + `.min` (Task 2); build gate (Task 5, 6) ✓
- Scope: engine + Foundations Check authored; other 11 empty state → Task 5 authors only `05`; Task 4 build proves the other 11 render the empty state ✓
- Accessibility: `<fieldset>/<legend>`, native radio group, `role="status"` + `aria-live`, text (not color-only) markers → `Quiz.tsx` (Task 4) ✓
- Testing DoD: unit `gradeQuiz`/schema; typecheck/build; e2e rewrite + empty-state; networked e2e mandatory → Tasks 1, 2, 6 ✓
- Out of scope respected: no multi-select/free-text, no per-question feedback mode, no score persistence, fixed `PASS_RATIO`, no A/D/CI/404 ✓

**Placeholder scan:** No TBD/TODO; every file's full content or exact edit is given; the 5 questions and the all-correct e2e selections are concrete and mutually consistent.

**Type consistency:** `QuizQuestion` is defined once in `src/lib/quiz/grade.ts` and imported by `Quiz.tsx` and (as a type) by `curriculum.ts`; the Zod `quizQuestionSchema` (Task 2) produces a structurally identical shape (`prompt: string`, `options: string[]`, `answerIndex: number`, `explanation: string`), so `entry.data.questions` assigns cleanly to `LessonMeta.questions?: QuizQuestion[]` and flows `toLessonMeta` → `LessonLayout` → `<Quiz questions>`. `gradeQuiz`, `PASS_RATIO`, `QuizResult` names are identical across Tasks 1, 4. `setComplete(slug, true)` matches the existing `ProgressStore`/`useProgress` contract. The all-correct option strings in Task 6 exactly match the `answerIndex` options authored in Task 5 (Q1→idx1, Q2→idx0, Q3→idx2, Q4→idx1, Q5→idx0).

No gaps.
