# Subsystem E — Content Production, Batch 1 — Design Spec

**Date:** 2026-05-16
**Status:** Approved
**Program context:** Subsystem E of the job-ready agentic-AI curriculum
product. Depends on B (curriculum framework, merged). E is inherently
batched — this spec defines the full curriculum map and authors **Batch 1
(Module 1: Foundations)** end-to-end as the quality template. Modules 2–12
are future E batches (one spec→plan→build cycle per module).

## Audience & goal

Target learner: a **working software engineer** (Python-fluent) becoming an
**AI engineer who ships production agentic systems**. No programming-basics
content. Concept- and mechanics-first; durable and framework-agnostic
(teach how agentic systems work, not a version-pinned SDK tutorial).

## Hands-on model (locked)

Interactive lessons run **pure Python in Pyodide** (no network, no `pip`,
no real LLM — real API/framework execution is subsystem D, not built).
Hands-on lessons therefore build agent mechanics **from scratch against a
deterministic mock LLM**. Real-API/framework specifics are taught
conceptually and explicitly tagged "(real integration: subsystem D)".
The deterministic `MockLLM` mental model is introduced in Module 1 and
**reused by every later module** for consistency.

## The full curriculum map (authoritative)

Comprehensive (~12 modules), durable, framework-agnostic. Only modules with
authored lessons are added to `src/content/modules.ts` (the B framework's
`buildCurriculum` fails the build on an empty module); the rest of the map
lives here and is appended per future batch.

1. **Foundations** — agent loop, LLM-as-policy, the mock-LLM harness
   *(authored in Batch 1)*
2. **Prompting & Control** — instructions, structured/parsed output,
   deterministic policy control
3. **Tool Use** — tool interface, the act step, selection, ReAct loop,
   errors/retries
4. **Retrieval & RAG** — chunking, embeddings (conceptual), grounding,
   citations
5. **Memory & State** — short/long-term memory, summarization,
   memory-as-tool
6. **Planning & Reasoning** — decomposition, plan-execute,
   reflection/self-critique
7. **Multi-Agent Systems** — roles, supervisor/worker, handoffs,
   shared state
8. **Evaluation & Testing** — task/trajectory metrics, regression suites,
   LLM-as-judge (conceptual)
9. **Guardrails & Safety** — I/O validation, prompt-injection awareness,
   safe tool execution
10. **Cost, Latency & Reliability** — token/cost models, caching,
    timeouts, fallback
11. **Observability & Debugging** — tracing the loop, structured logs,
    replaying trajectories
12. **Production & Deployment** — packaging, statelessness, real-API
    integration (subsystem D), rollout, capstone

## Batch 1 deliverable — Module 1 "Foundations"

`src/content/modules.ts` becomes a single module:
`{ id: "foundations", title: "Foundations", order: 1, summary: "The agent
loop, the LLM as decision policy, and the deterministic mock-LLM harness
every later module builds on." }`.
The placeholder `patterns` module and `src/content/lessons/04-tool-use.mdx`
are **removed** (deferred to the Tool Use batch; keeping `patterns` with no
lesson, or `04-tool-use` referencing the removed module, breaks the build).

Lessons (replace the 4 skeleton files in `src/content/lessons/`):

| order | slug | type | purpose |
|---|---|---|---|
| 1 | `01-what-is-an-agent` | reading | **Slug preserved** (keeps the live `/tutorials/01-what-is-an-agent` → `/learn/01-what-is-an-agent` redirect target resolvable). Opens with "what this track covers" + "how hands-on works (mock LLM, why)", then defines agent = perceive→decide→act and LLM-as-policy vs a plain LLM call. |
| 2 | `02-the-agent-loop` | interactive | Build the perceive→decide→act loop in pure Python with a deterministic hardcoded policy (expands the existing PyRunner sample; explained). |
| 3 | `03-the-mock-llm` | interactive | Introduce a deterministic `MockLLM` (prompt→response map) as the policy; swap hardcoded → "LLM-driven"; explain why a mock now and that real APIs arrive in subsystem D. Establishes the reusable harness. |
| 4 | `04-agent-anatomy` | reading | Perception / policy / action / memory decomposition; the separable-units best practice. |
| 5 | `05-foundations-check` | quiz | Closing knowledge-check (renders the B `QuizStub`; real engine is subsystem C). |

5 lessons: 2 reading, 2 interactive, 1 quiz.

## Content conventions (quality bar — applies to every future E batch)

- Assumes Python fluency; no Python-basics teaching.
- Concept/mechanics-first; durable; not version-specific SDK walkthroughs.
  Real APIs/frameworks described conceptually, tagged
  "(real integration: subsystem D)".
- Interactive lessons: **stdlib-only, deterministic** (no randomness/time
  dependence) so output is stable for the e2e assertion; authored at the
  indentation the MDX editor renders (the documented 2-space-normalization
  known limitation — write Python so it stays valid post-normalization).
- Every reading/interactive lesson: explicit learning objective up top, ≈6–12 min
  (`estMinutes`), a concrete best-practice callout, a forward link.
- Frontmatter exactly per B's `lessons` schema: `title`, `moduleId`
  (`"foundations"`), `order` (1-based, unique in module), `type`
  (`reading`|`interactive`|`quiz`), `summary`, `estMinutes`. (Quiz lessons are stubs: `LessonLayout` suppresses their body for `QuizStub`, so the objective/callout/forward-link conventions and the ≈6–12 min range do not apply to them.)

## Required test maintenance (in-scope)

Reworking the lessons **breaks the current 7 e2e tests** (they assert old
slugs/titles: `03-foundations-check`, "Tool Use →", etc.). Batch 1 **must
update `e2e/site.spec.ts`** to the Foundations lessons while keeping the
suite meaningful and not weakened. The updated suite asserts:

- landing renders + CTA → `/learn`, no severe console errors
- `/learn` syllabus shows the **Foundations** module heading and its
  lessons
- prev/next navigation between two Foundations lessons works
- mark-complete persists across reload (localStorage)
- the quiz lesson (`05-foundations-check`) renders the accessible stub
- the interactive lesson `02-the-agent-loop` runs real Python in-browser
  and the output panel shows its **exact deterministic output** (asserted,
  90s budget) — this lesson is the e2e PyRunner anchor
- `/tutorials/01-what-is-an-agent` redirects to
  `/learn/01-what-is-an-agent` (slug preserved, still resolves)

Unit tests (15: curriculum, progress store, toLessonMeta) are **unchanged**
— no logic is touched. Gates: `npx astro check` 0/0/0; `npm run build`
succeeds (5 lesson pages + `/learn` + `/tutorials/*` redirect stubs);
authoritative networked `npx playwright test` 7/7 incl. the real PyRunner
run. (Merging to `main` auto-deploys Vercel production; gates are
local-only per CLAUDE.md and must pass before merge.)

## Out of scope

- Modules 2–12 content (each a future E batch).
- Real LLM/framework execution (subsystem D).
- Quiz engine, grading, certificates (subsystem C).
- Accounts/auth/sync (subsystem A).
- Any framework/component/library code change — Batch 1 is **pure
  content** plus the `modules.ts` data edit and the `e2e/site.spec.ts`
  update driven by the content change.
