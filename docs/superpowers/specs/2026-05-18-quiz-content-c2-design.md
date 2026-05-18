# Subsystem C — Quiz Content, Cycle 2 — Design Spec

**Date:** 2026-05-18
**Status:** Approved
**Program context:** Subsystem C of the agentic-AI curriculum product.
Cycle 1 shipped and merged the quiz **engine** (Zod-validated frontmatter
schema, deterministic `gradeQuiz`, 70% pass via the existing
`ProgressStore`, the `Quiz` island with a graceful empty state) and
authored only the **Foundations Check** (`05-foundations-check.mdx`).
The other 11 module checks (modules 2–12) currently render the engine's
"coming soon" empty-state review note. Cycle 2 authors that missing
quiz **content**.

## Goal

Author real 5-question knowledge-check quizzes for all 11 remaining
module checks, completing the curriculum's quiz promise end-to-end, with
the same factual-accuracy and review rigor applied to the Foundations
Check in Cycle 1. No engine, schema, threshold, UI, or behavior change.

## Locked decisions

- **Per quiz:** exactly **5 single-answer multiple-choice** questions,
  in the existing shipped schema (`prompt`, `options` — ≥2, each
  non-blank, `answerIndex` an in-range integer, `explanation`).
- **Scope:** all **11** remaining checks (modules 2–12) in **one
  cycle / one branch (`quiz-content-c2`)**: `09-prompting-check`,
  `13-tools-check`, `17-rag-check`, `21-memory-check`,
  `25-planning-check`, `29-multi-agent-check`, `33-evaluation-check`,
  `37-guardrails-check`, `41-reliability-check`,
  `45-observability-check`, `49-production-check`.
- **Sourcing:** each quiz's questions are derived strictly from that
  module's three content lessons (the `order: 1` reading, `order: 2`
  interactive, `order: 3` reading that precede the `order: 4` check).
- **Quality bar (enforced in per-quiz content review):** every marked
  answer unambiguously correct; every distractor unambiguously wrong and
  targeting a real misconception from the lessons (not throwaway); no two
  options overlapping; explanations *justify* the key (not restate it);
  terminology faithful to the lessons; `answerIndex` varied across
  questions (not all the same position).
- **Body prose:** each check keeps the standard paragraph, module-named:
  "A knowledge check for the **{Module}** module. Answer every question,
  then submit to see your score and an explanation for each. Score 70%
  or higher to mark this lesson complete; you can retry as many times as
  you like."
- **Engine reuse:** zero changes to `quizQuestionSchema`, `gradeQuiz`,
  `Quiz.tsx`, `PASS_RATIO`, progress, layout, content config, routing, or
  the empty-state branch. Authoring is purely additive frontmatter.
- **Frontmatter invariants:** each check's existing `title`,
  `moduleId`, `order`, `type: "quiz"`, `summary`, `estMinutes` and its
  filename/slug are unchanged; only the `questions` array is added and
  the body prose normalized to the standard sentence above.

## Architecture / units

Eleven independent content units (one `*-check.mdx` each), plus two
test-infrastructure units:

- **`src/content/lessons/<NN>-<module>-check.mdx`** (×11) — add the
  `questions:` array; normalize the body paragraph. Module → lessons
  map for sourcing:
  - `09-prompting-check` (prompting) ← 06-controlling-the-policy,
    07-structured-output, 08-prompting-pitfalls
  - `13-tools-check` (tools) ← 10-what-is-a-tool, 11-a-tool-using-loop,
    12-tool-errors-and-retries
  - `17-rag-check` (rag) ← 14-grounding-and-rag, 15-a-tiny-retriever,
    16-rag-failure-modes
  - `21-memory-check` (memory) ← 18-why-agents-need-memory,
    19-conversation-memory, 20-memory-pitfalls
  - `25-planning-check` (planning) ← 22-decompose-then-act,
    23-a-plan-execute-loop, 24-reflection-and-limits
  - `29-multi-agent-check` (multi-agent) ← 26-when-multiple-agents,
    27-supervisor-and-workers, 28-coordination-failures
  - `33-evaluation-check` (evaluation) ← 30-how-to-measure-an-agent,
    31-an-eval-harness, 32-evaluation-pitfalls
  - `37-guardrails-check` (guardrails) ← 34-input-output-guardrails,
    35-a-guardrail-layer, 36-injection-and-safe-tools
  - `41-reliability-check` (reliability) ← 38-budgets-and-caching,
    39-caching-and-budgets, 40-timeouts-retries-fallback
  - `45-observability-check` (observability) ← 42-tracing-the-loop,
    43-a-trace-recorder, 44-debugging-from-traces
  - `49-production-check` (production) ← 46-shipping-an-agent,
    47-a-production-handler, 48-going-further
- **`tests/quiz-content.test.ts`** (new) — a Vitest content-guard:
  read every `type: "quiz"` lesson's frontmatter and assert it has a
  `questions` array of **≥5** entries that each pass the existing
  `quizQuestionSchema` (`src/lib/quiz/schema.ts`) — i.e. non-blank
  `prompt`/`explanation`, **≥2** non-blank `options`, integer
  `answerIndex` with `0 <= answerIndex < options.length`. Validates all
  12 quizzes (60 questions) deterministically. Parsing: the test reads
  each `*-check.mdx`, slices the frontmatter block between the first two
  `---` fences, parses it with the `yaml` package, and runs every
  `questions[i]` object through `quizQuestionSchema.safeParse` (reuse
  the shipped schema — do not reimplement the rules). `yaml` (v2,
  already in the tree as an Astro transitive dep) is added as an
  explicit **devDependency** so the test does not depend on a
  transitive resolution that a future dep bump could remove. (Astro
  content collections are not loadable under plain Vitest, so the test
  parses frontmatter directly rather than importing the collection.)
- **`e2e/site.spec.ts`** (modified) — remove the now-obsolete
  `"quiz: an un-authored check shows the review note"` test (after
  Cycle 2 there is no un-authored check); keep the Foundations
  all-correct→pass→complete-persists test unchanged; add ONE all-correct
  e2e for a representative newly-authored quiz (`13-tools-check`) whose
  five correct option strings are authored in ASCII so the
  role/name locators are robust.

## Data flow

Authored `questions` frontmatter → `quizQuestionSchema` runs at
`npm run build` (content-collection integrity gate; a malformed quiz
fails the build with a Zod path) → `toLessonMeta` threads `questions`
into `LessonMeta` → `Quiz` island renders/grades exactly as in Cycle 1
(70% → existing `ProgressStore.setComplete`). No new code paths.

## Error handling

- Malformed quiz frontmatter → `npm run build` fails (existing Zod
  gate) and `tests/quiz-content.test.ts` fails — caught before merge.
- A factually wrong key/ambiguous distractor is not machine-detectable;
  it is caught by the **mandatory per-quiz content-correctness review**
  (a reviewer cross-checks every question against that module's three
  lessons), the same gate that validated the Foundations Check.
- The empty-state branch in `Quiz.tsx` is retained (defensive for any
  future quiz lesson added without questions) but is no longer exercised
  by e2e because no shipped quiz lacks content; the content-guard test
  asserts that invariant (every quiz has ≥5 questions).

## Testing (Definition of Done)

- **Unit:** `npm test` green, including the new
  `tests/quiz-content.test.ts` (all 12 quizzes ≥5 schema-valid
  questions, `answerIndex` in range). All prior unit suites unchanged.
- **Type/build:** `npm run typecheck` (`astro check`) 0/0/0;
  `npm run build` green, 51 pages — the content collection Zod-validates
  all 60 questions; slugs/order/type unchanged so curriculum integrity,
  prev/next, and the `/tutorials/` redirect stay valid.
- **e2e (mandatory gate):** networked Playwright green — the obsolete
  `un-authored check` test removed; the Foundations all-correct test
  unchanged; one added all-correct test for `13-tools-check`; the
  interactive live-Pyodide anchor and all other originals unchanged.
- **Per-quiz content-correctness review:** each of the 11 quizzes is
  reviewed against its module's three lessons for factual accuracy,
  unambiguous keys, plausible-but-wrong distractors, justifying
  explanations, and faithful terminology (the Cycle 1 standard).

## Out of scope

- Any engine/schema/`PASS_RATIO`/`Quiz.tsx`/layout/empty-state change.
- New question types (multi-select, true/false-typed, free-text,
  ordering); per-question immediate feedback; question shuffling;
  scoring/attempt persistence.
- Content edits to non-quiz lessons; rewording module summaries or
  titles.
- An all-correct e2e for every quiz (only `13-tools-check` is
  e2e-coupled; the other 10 are guarded by the unit content-guard +
  the Zod build gate).
- Subsystem A (accounts), D Cycle 2, CI workflow, custom 404.
