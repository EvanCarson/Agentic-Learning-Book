# Subsystem C — Quiz Engine, Cycle 1 — Design Spec

**Date:** 2026-05-17
**Status:** Approved
**Program context:** Subsystem C of the agentic-AI curriculum product.
Depends on B (curriculum framework, merged) and the 49-lesson curriculum
(merged). Independent of Subsystem D (BYO-key execution, PR open). C
replaces the `QuizStub` "coming soon" placeholder on `type: "quiz"`
lessons with a real, deterministic, in-browser quiz engine.

## Goal

Deliver a working, reviewed **interactive quiz engine** that turns the
curriculum's third lesson type (`quiz`) from a placeholder into a real
knowledge check: schema-validated questions authored in the check
lesson's frontmatter, submit-all grading with per-question explanations,
and a pass that marks the lesson complete through the existing progress
seam. Cycle 1 authors one flagship quiz end-to-end; the other 11 module
checks render a graceful empty state via the same engine.

## Locked decisions

- **Authoring format:** quiz questions live in the existing
  `src/content/lessons/NN-<module>-check.mdx` frontmatter as a
  Zod-validated `questions` array. One file per quiz; bad content fails
  `npm run build`, consistent with existing content integrity.
- **Question type:** single-answer multiple choice only. Each question
  has ≥2 options and exactly one correct option. (True/false is just the
  2-option case. No multi-select, no free-text — YAGNI.)
- **Grading & feedback:** submit-all-then-score. The learner answers
  every question, submits once, then sees the score, a per-question
  correct/incorrect mark, and a short explanation for each question.
- **Pass & progress:** a submission scoring **≥ 70%** correct marks the
  lesson complete via the existing
  `ProgressStore.setComplete(slug, true)` seam — the same completion
  state as reading/interactive lessons. Retake is unlimited; once
  complete it stays complete (a later failing attempt does not
  un-complete). The manual "Mark complete" button remains available on
  all lessons. **No new persisted state** is introduced: the in-progress
  attempt (selected answers, last score) is in-memory React state only
  and resets on reload; only completion persists, via the existing store.
- **Scope (Cycle 1):** build the full engine and author the **Foundations
  Check** (`src/content/lessons/05-foundations-check.mdx`, ~5 questions).
  The other 11 `*-check.mdx` lessons render the engine's graceful
  empty/review state until a later content cycle.
- Stays a static Astro site — no backend. Grading is pure client-side
  TypeScript over data baked into the page at build.

## Architecture

Three units with clear boundaries, each independently testable:

- **Schema** — `src/content.config.ts`. Add an optional `questions` field
  to the `lessons` collection schema:

  ```ts
  const quizQuestion = z.object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
    explanation: z.string().min(1),
  });
  // schema: { …existing…, questions: z.array(quizQuestion).optional() }
  ```

  A `.superRefine` on the lesson schema asserts that for every question
  `answerIndex < options.length`. Invalid quiz content fails the content
  build with a clear Zod path. (`questions` is optional so the other 11
  un-authored checks remain build-valid.)

- **Pure grader** — `src/lib/quiz/grade.ts`. No React, no DOM, fully
  deterministic:

  ```ts
  export const PASS_RATIO = 0.7;
  export interface QuizQuestion {
    prompt: string; options: string[]; answerIndex: number; explanation: string;
  }
  export interface QuizResult {
    correct: number; total: number; ratio: number; passed: boolean;
    perQuestion: { correct: boolean }[];
  }
  export function gradeQuiz(
    questions: QuizQuestion[],
    answers: (number | null)[],
  ): QuizResult;
  ```

  `ratio = total === 0 ? 0 : correct / total`. `passed = total > 0 &&
  ratio >= PASS_RATIO`. An unanswered question (`null`) or an answer
  index not equal to `answerIndex` is incorrect. A `total === 0` quiz is
  never "passed" (the empty-state path never grades).

- **Quiz island** — `src/components/Quiz.tsx` (replaces
  `src/components/QuizStub.tsx`, which is deleted). Props: `slug: string`,
  `questions: QuizQuestion[]`. Behaviour:
  - If `questions` is empty/absent → render the **review state**: a
    `role="note"` panel carrying forward the existing QuizStub copy
    ("Knowledge checks are coming soon. For now, review the lesson and
    mark it complete when you are confident.") plus the lesson title.
  - Otherwise render each question as a `<fieldset>` with a `<legend>`
    (the prompt) and a real radio group of options. A **Submit** button
    is disabled until every question has a selected answer.
  - On submit: call `gradeQuiz`, then show a `role="status"`
    `aria-live="polite"` summary ("You scored X / N — passed/keep
    reviewing"), and for each question a ✓/✗ marker **with a text label**
    (not color alone) and its `explanation`. Show a **Retry** button that
    clears answers and results for another attempt.
  - On a `passed` result, call `useProgress().setComplete(slug, true)`
    exactly once per passing submission (idempotent; safe to call again
    on retake).

- **Layout wiring** — `src/layouts/LessonLayout.astro`. Replace the
  `<QuizStub client:load title={lesson.title} />` branch with
  `<Quiz client:load slug={lesson.slug} questions={lesson.questions ?? []} />`.
  `LessonLayout` already receives the lesson data server-side; the
  curriculum/`LessonMeta` mapping (`src/lib/curriculum.ts` /
  `toLessonMeta`) is extended to carry `questions` through to the layout
  prop. The `quiz` branch otherwise keeps the existing page chrome
  (type/min line, `<h1>`, MarkComplete, prev/next).

## Data flow

`NN-*-check.mdx` frontmatter `questions`
→ Zod-validated at content build (bad content fails `npm run build`)
→ `getStaticPaths`/curriculum mapping carries `questions` into `LessonMeta`
→ `LessonLayout.astro` passes `slug` + `questions` into `<Quiz client:load>`
→ learner answers in-memory; **Submit**
→ pure `gradeQuiz(questions, answers)` → `QuizResult`
→ score + per-question explanations rendered; if `passed`, existing
  `ProgressStore.setComplete(slug, true)` (localStorage now;
  Supabase-ready behind the same synchronous seam later).

No quiz data crosses the network; nothing new is persisted.

## Error handling & edge cases

- **Empty/missing `questions`** → review state, never a broken or empty
  quiz. This is the path for the 11 un-authored checks in Cycle 1.
- **Malformed quiz content** (e.g., `answerIndex` out of range, <2
  options, empty prompt) → `npm run build` fails with the Zod error path
  identifying the lesson; never ships.
- **Partial answers** → Submit is disabled until all questions are
  answered, so grading is never ambiguous.
- **Idempotent completion** → re-passing calls `setComplete(slug, true)`
  again harmlessly. **Failing after passing does not un-complete**: the
  engine only ever calls `setComplete(slug, true)`, never `false`.
- **Reload mid-attempt** → in-memory answers reset (by design, consistent
  with the product's in-memory ethos); persisted completion is unaffected
  and is re-reflected via the existing progress islands.
- **No console logging**; the quiz never throws into the page.

## Accessibility

- Each question: `<fieldset>` + `<legend>`; options are a native radio
  group (keyboard-navigable, single-selection).
- Results summary: `role="status"` + `aria-live="polite"` so the score
  is announced on submit.
- Correct/incorrect conveyed with a text label and symbol, **not color
  alone**.
- Submit/Retry are real `<button>`s with discernible names; disabled
  state is conveyed via the `disabled` attribute.
- Consistent with the codebase's existing a11y standard (labelled
  landmarks, `aria-current`, `aria-live` on dynamic regions).

## Testing (Definition of Done)

- **Unit (Vitest):**
  - `gradeQuiz` — all-correct (passed), all-wrong (not passed), exactly
    70% boundary (passed), just-below-70% (not passed), unanswered
    counts as wrong, `total === 0` never passed, `perQuestion` flags
    align with answers.
  - Content test — `05-foundations-check.mdx` parses with a
    schema-valid `questions` array (≥1 question; every `answerIndex` in
    range), guarding the authored flagship.
- **Type/build:** `npm run typecheck` (`astro check`) 0/0/0;
  `npm run build` green (schema validates all 12 check lessons; 51
  pages; slugs unchanged so curriculum integrity, prev/next, and the
  `/tutorials/` redirect stay valid).
- **e2e (mandatory gate, `npm run e2e`, headless Chromium):**
  - **Rewrite** the existing `"quiz lesson renders the accessible stub"`
    test: on `/learn/05-foundations-check`, answer all questions
    correctly, Submit, assert the score summary appears and the lesson
    shows as complete, and that completion **persists across reload**.
  - **Add** an empty-state test on an un-authored check (e.g.
    `/learn/09-prompting-check`): assert the review `role="note"`
    message renders and there is no broken/empty quiz form.
  - The other 6 existing e2e tests remain unchanged and green
    (landing, syllabus, prev/next, mark-complete, the interactive
    PyRunner anchor, the redirect).

## Out of scope (later cycles / other subsystems)

- Authoring the other 11 module-check quizzes (later content cycle;
  they ship the empty state in Cycle 1).
- Multi-select, true/false-typed, ordering, or free-text questions.
- Per-question immediate feedback mode; timed quizzes; question
  shuffling/randomization; question banks larger than what is shown.
- Persisting scores, attempt counts, or answer history (only
  pass→complete is persisted, via the existing store).
- Configurable per-quiz pass thresholds (fixed `PASS_RATIO = 0.7`).
- Subsystem A (accounts/Supabase sync) and Subsystem D (BYO-key); the
  GitHub Actions CI gate and custom 404 (separate optional infra).
