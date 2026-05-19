# Subsystem D — Agent Execution Layer, Cycle 2 — Design Spec

**Date:** 2026-05-18
**Status:** Approved
**Program context:** Subsystem D of the agentic-AI curriculum product.
Cycle 1 shipped and merged the BYO-key real-model execution path
(`PolicyRunner`, `ModelSettings`, `callRealModel`, `modelConfig`
in-memory key, `mockAgentLoopPolicy`) on the single flagship lesson
`02-the-agent-loop`. Cycle 2 broadens real-mode to the **other
interactive lessons that have a genuine model-decision seam**.

## Goal

Let learners run a real, BYO-key model on the interactive lessons whose
snippet has a real "observation → model decision" seam — not just the
flagship — while the default deterministic mock output stays
**byte-identical** so no-key learners and CI are unaffected.

## Locked decisions

- **Selective scope (6 lessons).** Only the interactive lessons whose
  snippet contains a `prompt/observation → model decision` the agent
  acts on:
  - `03-the-mock-llm` — `policy = MockLLM(table)`; `policy(prompt)`
  - `07-structured-output` — `MockLLM` → `"KIND: arg"` → `parse_action`
  - `11-a-tool-using-loop` — `MockLLM` → `"tool: arg"` → dispatch
  - `27-supervisor-and-workers` — `Supervisor.route(task) → role`
  - `47-a-production-handler` — `def policy(req) → "search: weather"`
  - `23-a-plan-execute-loop` — `MockPlanner(goal) → [steps]` (heaviest:
    policy returns a list; real mode must parse a plan)
- **Excluded (no model-decision seam — model absent or pure infra):**
  `15-a-tiny-retriever` (retrieval scoring), `19-conversation-memory`
  (`Memory` class, no model call), `31-an-eval-harness`,
  `35-a-guardrail-layer`, `39-caching-and-budgets`,
  `43-a-trace-recorder`. These keep `PyRunner` unchanged.
- **Mechanism: keep each lesson's original mock code path literally
  unchanged.** Mock-mode byte-identicality is guaranteed *structurally*
  (the original mock expression still runs verbatim), not by
  re-derivation. Real mode swaps only the call site.
- **Minimal additive PolicyRunner extension** (NOT a rewrite; lesson 02
  unaffected): in addition to the existing injected `policy`,
  `PolicyRunner` also injects two Pyodide globals — `alb_real_mode`
  (boolean: `cfg.mode === "real" && !!cfg.apiKey`) and
  `alb_call_model` (async `(prompt: string) => callRealModel(prompt,
  cfg)`). The existing `policy` global and `mockAgentLoopPolicy` usage
  are untouched, so `02-the-agent-loop` needs no change.
- **Real-mode call** uses `callRealModel` with a short, lesson-specific
  instruction prepended to the observation so the model is asked to
  answer in the lesson's expected format. The lesson's existing
  parser/fallback is left intact, so a real model that disobeys the
  format degrades into the lesson's own defined fallback — an honest
  teaching moment about real-model unreliability and why the
  seam/parser exists.
- **No engine change beyond the additive PolicyRunner globals.** No
  change to `ModelSettings`, `callRealModel` (`src/lib/realPolicy.ts`),
  `modelConfig`, the in-memory-key handling, `mockAgentLoopPolicy`, or
  `PyRunner`.
- **Verification:** deterministic per-lesson mock-parity check + the
  unchanged lesson-02 PolicyRunner e2e anchor + one representative
  networked all-mock e2e on a reworked lesson. **No real-model call in
  CI** (real path stays unit-tested by `tests/realPolicy.test.ts`).

## Architecture

- **`src/components/PolicyRunner.tsx`** — add two injected globals in
  the existing `run()` (where it already builds `cfg` and sets the
  `policy` global), additive only:
  - `pyodide.globals.set("alb_real_mode", cfg.mode === "real" && !!cfg.apiKey)`
  - `pyodide.globals.set("alb_call_model", async (prompt) => callRealModel(prompt, cfg))`
  The existing `policy` injection (real-or-`mockAgentLoopPolicy`) stays
  exactly as is. PolicyRunner already runs `runPythonAsync`, so snippet
  `await` works.
- **The 6 lesson `.mdx` files** — change `import PyRunner` →
  `import PolicyRunner` and `<PyRunner .../>` → `<PolicyRunner .../>`;
  in the snippet, replace **only the model-decision call site** with a
  branch that runs the original mock expression unchanged when
  `not alb_real_mode`, and `await alb_call_model(<instruction+prompt>)`
  when `alb_real_mode`, then feeds the result through the lesson's
  existing parser/loop unchanged. Per-lesson call-site transform:

  | Lesson | Original call | Reworked call (mock branch verbatim) |
  |---|---|---|
  | 03 | `policy(prompt)` | `(await alb_call_model(INSTR+prompt)) if alb_real_mode else policy(prompt)` |
  | 07 | `llm(prompt)` | `(await alb_call_model(INSTR+prompt)) if alb_real_mode else llm(prompt)` |
  | 11 | `llm(prompt)` | `(await alb_call_model(INSTR+prompt)) if alb_real_mode else llm(prompt)` |
  | 27 | `sup.route(t)` | `(parse_role(await alb_call_model(INSTR+t))) if alb_real_mode else sup.route(t)` |
  | 47 | `policy(request)` | `(await alb_call_model(INSTR+request)) if alb_real_mode else policy(request)` |
  | 23 | `planner(goal)` | `(parse_plan(await alb_call_model(INSTR+goal))) if alb_real_mode else planner(goal)` |

  `INSTR` is a short per-lesson constant string defined in the snippet
  (e.g. 11: `"Reply with exactly 'tool: <arg>' or 'answer: <text>'. "`).
  `parse_role`/`parse_plan` are tiny snippet helpers that map free model
  text onto the lesson's expected shape and fall back to the lesson's
  existing default on mismatch (27 → `"text"`; 23 → `[]`), so the loop
  is unchanged and the mock path is byte-identical.
  - **The reworked lessons do not use the injected `policy` global**
    (that global stays for `02-the-agent-loop` only). They use
    `alb_real_mode`/`alb_call_model` plus their own original mock
    object. Note lesson 03's mock object is itself named `policy`
    (`policy = MockLLM(...)`); in mock mode the snippet's local `policy`
    shadows the injected global harmlessly, and real mode uses
    `alb_call_model`, so there is no functional collision.
- **Prose** — each reworked lesson gets the same one-line note
  `02-the-agent-loop` has ("toggle **Real (your key)** above to run
  this on your own model; mock is the default"). Objective, structure,
  best-practice callouts, frontmatter (title/slug/order/type) unchanged.

## Data flow

- **Mock (default, no key):** `alb_real_mode` is `false`; the snippet
  runs its original mock expression verbatim → byte-identical output;
  zero network; CI unaffected.
- **Real:** learner enters key in `ModelSettings` (in-memory, D1
  behavior unchanged) and toggles Real → `alb_real_mode` true →
  `alb_call_model(INSTR+observation)` does a browser `fetch` via
  `callRealModel` → the lesson's existing parser handles the response
  (success → real output flows through the unchanged loop; malformed →
  the lesson's defined fallback, demonstrating the seam's value).

## Error handling

- Real call failure (CORS/network/HTTP/JSON/missing content) →
  `callRealModel`'s existing typed error string surfaces in the
  PolicyRunner output exactly as in D1; never crashes the runner; the
  key never appears in any message (D1 guarantee, unchanged).
- Real model returns an unparseable/wrong-format response → the
  lesson's existing parser/fallback handles it (e.g. `("ANSWER",
  "unparseable")`, role `"text"`, plan `[]`), so the loop still
  completes and the learner sees the seam absorb the failure.
- No key / mock mode → original deterministic behavior, unchanged.

## Testing (Definition of Done)

- **Per-lesson mock-parity check (deterministic, no browser/network):**
  for each of the 6 lessons, capture the pre-rework snippet's stdout
  and the post-rework snippet's **mock-mode** stdout (both run through
  the same MDX 2-space-normalization, with `alb_real_mode = False` and
  a stub `alb_call_model` that must never be called in mock mode) and
  assert they are **byte-identical**. Lives as a Vitest/`python3`-exec
  check in `tests/`.
- **e2e (mandatory gate):** the existing `02-the-agent-loop`
  PolicyRunner anchor stays unchanged and green; add **one** networked
  all-mock Playwright test on a reworked lesson (`03-the-mock-llm`):
  Run → assert its exact unchanged mock output in
  `pre[aria-live='polite']`. No real-model call in CI.
- **Type/build/unit:** `npm test` green (incl. the new parity check);
  `npx astro check` 0/0/0; `npm run build` green, 51 pages (slugs/
  order/type unchanged → curriculum integrity, prev/next, redirect
  intact).
- **Manual (documented, post-merge, needs a key):** spot-check real
  mode on 1–2 reworked lessons — same still-open caveat as D1; not a
  CI gate.

## Out of scope

- The 6 excluded interactive lessons; `PyRunner` itself.
- The synchronous `SharedArrayBuffer`/worker byte-identical bridge
  (Approach A) and any COOP/COEP headers — still deferred.
- Streaming responses, function/tool-calling APIs, multi-message
  conversation history in the request, provider-specific features.
- Persisted keys, key managers, multiple profiles.
- Subsystems A (accounts) and C (done); the GitHub Actions CI gate and
  custom 404.
