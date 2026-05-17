# Content: Modules 2–12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. Execute on branch `content-batch-1` (accumulates into PR #3). One module per task; each task is one commit; gates green per commit.

**Goal:** Author the remaining 11 curriculum modules (2–12) of the approved E map, each as ~4 lessons following the locked Foundations quality bar, accumulating into PR #3.

**Architecture:** Pure content + the `modules.ts` data file. No framework/component/library code change. Each module = one `modules.ts` entry (order = module number) + its lesson MDX files, added in one commit so the B `buildCurriculum` invariants hold at every commit (module non-empty; `(moduleId, order)` unique within module; globally-unique lesson slug; `type` ∈ reading|interactive|quiz). The Module-1 `MockLLM` seam (`policy(observation) -> action`, observation=prompt, action=response) is the reusable harness every interactive lesson here builds on.

**Tech Stack:** Astro 6 content collections (B, unchanged), MDX, PyRunner (unchanged), Vitest (15, unchanged — no logic). Verification per task: `npx astro check` 0/0/0 + `npm run build` green; the networked Playwright suite (controller-run) stays 7/7 (Foundations slugs/anchor untouched).

**Conventions (locked by the E spec; every reading/interactive lesson):** explicit `**Objective:**` first line; concept/mechanics-first, durable, framework-agnostic; real APIs/frameworks described conceptually tagged "(real integration: subsystem D)"; one `> **Best practice:**` callout; a closing `Next: **<next lesson title>**` forward link (last lesson of a module points to the next module's first lesson; Module 12's last content lesson points to its quiz). The forward link form is EXACTLY `Next: **<Title>**` — no trailing period, no description clause — uniformly across Modules 2–12. Every interactive lesson includes one sentence bridging back to the Module-1 `MockLLM` seam (same seam, possibly renamed for perspective). Prefer durable vocabulary (e.g. say "instruction", not "system prompt"; the latter is a real-API message role deferred to subsystem D). Interactive lessons: stdlib-only, deterministic, authored at 4-space indentation that stays valid after the documented MDX 2→space normalization (shallow nesting only). Quiz lessons: stub body (LessonLayout renders QuizStub); conventions/estMinutes range do not apply.

**Slug numbering:** Foundations used `01`–`05`. New lessons continue a global running prefix `06`…`49`; the frontmatter `order` is the within-module position (1-based). Filenames: `src/content/lessons/<NN>-<slug>.mdx`.

**Per-module shape (4 lessons):** (1) reading — the concept; (2) interactive — build the pattern from scratch against the mock; (3) reading — best practices & pitfalls; (4) quiz — stub. `moduleId` = the module id below; within-module `order` = 1,2,3,4.

`modules.ts` final state (Foundations entry already present, order 1; append these):

```ts
{ id: "prompting",    title: "Prompting & Control",        order: 2,  summary: "Turning model output into reliable, parseable decisions." },
{ id: "tools",        title: "Tool Use",                    order: 3,  summary: "Letting agents act through well-described, testable tools." },
{ id: "rag",          title: "Retrieval & RAG",             order: 4,  summary: "Grounding answers in retrieved context with citations." },
{ id: "memory",       title: "Memory & State",              order: 5,  summary: "Carrying state across turns: working memory and summaries." },
{ id: "planning",     title: "Planning & Reasoning",        order: 6,  summary: "Decomposition, plan-execute, and reflection loops." },
{ id: "multi-agent",  title: "Multi-Agent Systems",         order: 7,  summary: "Coordinating specialised agents: supervisor and workers." },
{ id: "evaluation",   title: "Evaluation & Testing",        order: 8,  summary: "Measuring agents: task success and trajectory checks." },
{ id: "guardrails",   title: "Guardrails & Safety",         order: 9,  summary: "Validating inputs/outputs and executing tools safely." },
{ id: "reliability",  title: "Cost, Latency & Reliability", order: 10, summary: "Budgets, caching, timeouts, retries, and fallback." },
{ id: "observability",title: "Observability & Debugging",   order: 11, summary: "Tracing the loop and replaying failed trajectories." },
{ id: "production",   title: "Production & Deployment",      order: 12, summary: "Statelessness, real-API integration, rollout, capstone." },
```

---

## Per-task template (apply to every Module task below)

> **Authoritative-conventions note:** the **Conventions** section above
> is authoritative and overrides any stale punctuation/prose in the
> per-module verbatim blocks below (which were drafted before the lock).
> Specifically, for every interactive lesson: the closing line is
> `Next: **<Title>**` with NO trailing period; include one sentence
> bridging to the Module-1 `MockLLM` seam; and where a tool/component
> parses its own arguments, say so in one sentence. Objectives must
> describe only what the shown code demonstrates (don't claim behaviour
> the snippet doesn't exhibit).

**Files:** Modify `src/content/modules.ts` (append the one entry for this module from the table above, preserving the existing `Module` interface and the Foundations entry). Create the 4 lesson files listed in the task.

**Steps (every Module task):**
- [ ] Step 1: Append this module's entry to the `modules` array in `src/content/modules.ts` (exact object from the table above; keep trailing newline).
- [ ] Step 2: Create lesson 1 (reading) exactly as specified (frontmatter verbatim; author prose to the objective + outline + conventions).
- [ ] Step 3: Create lesson 2 (interactive) exactly as specified — frontmatter verbatim, the `import PyRunner ...` line, and the `<PyRunner client:visible code={` … `} />` Python **verbatim** (deterministic, do not alter).
- [ ] Step 4: Create lesson 3 (reading) exactly as specified.
- [ ] Step 5: Create lesson 4 (quiz) with the standard stub body.
- [ ] Step 6: Verify gates:
  ```bash
  cd /Users/cq/Git/agentic/Agentic-Learning-Book
  npx astro check
  npm run build
  ```
  Expected: astro check 0/0/0; build succeeds; the module's 4 lesson pages exist under `dist/learn/`; orders within the module are 1,2,3,4 (unique) and all slugs globally unique → no `buildCurriculum` throw.
- [ ] Step 7: For the interactive lesson, verify the 2-space-normalized Python parses + runs deterministically:
  ```bash
  python3 - <<'PY'
  # paste the lesson's code with every leading 4-space unit replaced by 2-space
  PY
  ```
  Expected: prints the lesson's stated deterministic output, no exception.
- [ ] Step 8: Commit: `git add -A && git commit -m "feat(content): add Module N — <title>"`.

Standard quiz stub body (lesson 4 of every module — substitute `<MODULE TITLE>` and the three review topics):

```mdx
---
title: "<MODULE TITLE> Check"
moduleId: "<id>"
order: 4
type: "quiz"
summary: "Quick knowledge check on <module topic>."
estMinutes: 4
---

A knowledge check for the <MODULE TITLE> module. The interactive quiz
engine is coming soon; review <topic A>, <topic B>, and <topic C>, then
mark this complete when you are confident.
```

---

### Task 1 — Module 2: Prompting & Control  (`moduleId: "prompting"`, module order 2)

Lessons (slugs `06`–`09`):

**`06-controlling-the-policy.mdx`** — reading, order 1, estMinutes 8, summary "Why raw model text is unreliable and how instructions + structure fix it."
Objective: explain why free-form model output is unsafe to act on and how an instruction + a constrained output shape make the policy reliable.
Outline: free text → ambiguous actions; the instruction is part of the policy, not decoration; constrain the output to a small grammar (a verb + argument); validate before acting; determinism of the *contract*, not the model. Best-practice callout: "Never `eval`/branch on raw model prose — parse a declared, validated shape." Forward link → **Structured Output**.

**`07-structured-output.mdx`** — interactive, order 2, estMinutes 11, summary "Parse a constrained model response into a typed action." Exact body:

````mdx
---
title: "Structured Output"
moduleId: "prompting"
order: 2
type: "interactive"
summary: "Parse a constrained model response into a typed action."
estMinutes: 11
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** make the policy return a *constrained* response and parse
it into a `(kind, argument)` action your loop can trust.

The mock returns strings shaped `KIND: argument`. The agent never acts on
raw text — it parses, validates the `kind`, and only then proceeds.

<PyRunner client:visible code={`VALID = {"TOOL", "ANSWER"}

class MockLLM:
    def __init__(self, table):
        self.table = table

    def __call__(self, prompt):
        return self.table.get(prompt, "ANSWER: i_dont_know")

def parse_action(response):
    kind, sep, arg = response.partition(":")
    kind = kind.strip()
    if sep == "" or kind not in VALID:
        return ("ANSWER", "unparseable")
    return (kind, arg.strip())

llm = MockLLM({
    "weather in nyc?": "TOOL: get_weather",
    "say hi": "ANSWER: hello",
    "garbled": "??? no colon here",
})

for prompt in ["weather in nyc?", "say hi", "garbled"]:
    print(prompt, "=>", parse_action(llm(prompt)))
`} />

This `MockLLM` is the same seam from Foundations, here named `llm` for
the model's perspective — the agent still just calls it.

Parsing + validating is the whole lesson: the model is untrusted input;
the `(kind, argument)` tuple is the trusted contract your loop runs on.

> **Best practice:** define the output grammar and a total parser with a
> safe fallback. An unparseable response must degrade to a defined action,
> never crash the loop.

Next: **Prompting Pitfalls**
````
Deterministic output: `weather in nyc? => ('TOOL', 'get_weather')` / `say hi => ('ANSWER', 'hello')` / `garbled => ('ANSWER', 'unparseable')`.

**`08-prompting-pitfalls.mdx`** — reading, order 3, estMinutes 7, summary "Injection, ambiguity, and over-trusting the model."
Objective: recognise the common ways prompt/output handling fails in production and the defensive habits that prevent them.
Outline: instruction ambiguity → inconsistent actions; output drift across model versions (why a parser + tests beat prompt-tweaking); prompt injection via tool/user data (preview of Guardrails module); never interpolate untrusted text into an instruction without isolation; log the raw response for debugging. Best-practice callout: "Pin behaviour with a parser + tests, not with ever-longer prompts." Forward link → **Prompting & Control Check**.

**`09-prompting-check.mdx`** — quiz, order 4 (standard stub; review topics: the instruction-as-policy idea, structured output + total parsing, prompting pitfalls). Forward link in stub not required (quiz body suppressed).

---

### Task 2 — Module 3: Tool Use  (`moduleId: "tools"`, module order 3)

Lessons (slugs `10`–`13`):

**`10-what-is-a-tool.mdx`** — reading, order 1, estMinutes 8, summary "The act step: a tool is a named, described, validated function."
Objective: define a tool as the agent's action surface and the contract a tool must present (name, description, typed args, deterministic effect).
Outline: perceive-decide-act → tools are "act"; a tool = name + doc + signature + impl; the model picks the tool+args, the runtime executes, the result becomes the next observation; tools must be individually testable (pure where possible); never let the model execute arbitrary code — it selects from a registry. Best-practice callout: "Small, well-described, independently tested tools — the model only *chooses*, it never *executes*." Forward link → **A Tool-Using Loop**.

**`11-a-tool-using-loop.mdx`** — interactive, order 2, estMinutes 12, summary "Build a ReAct-style loop: the policy picks a tool, the runtime runs it." Exact body:

````mdx
---
title: "A Tool-Using Loop"
moduleId: "tools"
order: 2
type: "interactive"
summary: "Build a ReAct-style loop: the policy picks a tool, the runtime runs it."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** wire a tool registry into the loop — the policy chooses a
tool name and the runtime executes the registered function from a registry
you control.

<PyRunner client:visible code={`def get_weather(city):
    return "sunny in " + city

def add(args):
    a, b = args.split(",")
    return str(int(a) + int(b))

TOOLS = {"get_weather": get_weather, "add": add}

class MockLLM:
    def __init__(self, table):
        self.table = table

    def __call__(self, prompt):
        return self.table.get(prompt, "answer: i_dont_know")

def run(prompt, llm):
    decision = llm(prompt)
    name, _, arg = decision.partition(":")
    name = name.strip()
    if name in TOOLS:
        result = TOOLS[name](arg.strip())
        print(prompt, "-> tool", name, "->", result)
    else:
        print(prompt, "-> answer ->", arg.strip())

llm = MockLLM({
    "weather in paris": "get_weather: paris",
    "two plus three": "add: 2,3",
    "hello": "answer: hi",
})

for p in ["weather in paris", "two plus three", "hello"]:
    run(p, llm)
`} />

The loop never trusts the model to *run* anything — it maps a chosen
**name** to a vetted function in `TOOLS`. Unknown names fall back to a
plain answer.

> **Best practice:** the model selects a tool by name from a registry you
> control; argument parsing and execution are your code, not the model's.

Next: **Tool Errors & Retries**.
````
Deterministic output: `weather in paris -> tool get_weather -> sunny in paris` / `two plus three -> tool add -> 5` / `hello -> answer -> hi`.

**`12-tool-errors-and-retries.mdx`** — reading, order 3, estMinutes 8, summary "Tools fail; the agent must observe failure and recover."
Objective: treat tool failure as a normal observation and design bounded recovery.
Outline: tools fail (bad args, exceptions, timeouts) — failure is an observation, feed it back; bound retries (attempt budget) to avoid loops; validate args before calling; idempotency for safe retries; surface a clean degraded answer when the budget is exhausted; real network/timeout specifics tagged "(real integration: subsystem D)". Best-practice callout: "A failed tool call is data for the next decision, not an exception that ends the run — but always cap retries." Forward link → **Tool Use Check**.

**`13-tools-check.mdx`** — quiz, order 4 (standard stub; review: tool contract, registry-not-eval, failure-as-observation + retry budget).

---

### Task 3 — Module 4: Retrieval & RAG  (`moduleId: "rag"`, module order 4)

Lessons (slugs `14`–`17`):

**`14-grounding-and-rag.mdx`** — reading, order 1, estMinutes 8, summary "Why retrieval beats memorisation: ground answers in fetched context."
Objective: explain RAG as "retrieve relevant context, then condition the answer on it" and why it reduces hallucination and enables citations.
Outline: parametric vs retrieved knowledge; the RAG shape: query → retrieve → stuff context → answer with citations; chunking and why; embeddings as similarity (conceptual; real embedding APIs tagged subsystem D); the agent treats retrieval as a tool. Best-practice callout: "Ground every factual claim in a retrieved chunk and carry the source id through to the answer." Forward link → **A Tiny Retriever**.

**`15-a-tiny-retriever.mdx`** — interactive, order 2, estMinutes 12, summary "Build keyword retrieval + grounded answer with a citation." Exact body:

````mdx
---
title: "A Tiny Retriever"
moduleId: "rag"
order: 2
type: "interactive"
summary: "Build keyword retrieval + a grounded answer with a citation."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** retrieve the most relevant document by simple word overlap,
then answer *only* from it and cite its id. Real embedding similarity is
the same shape with a better scorer (subsystem D).

<PyRunner client:visible code={`DOCS = {
    "d1": "the sky is blue because of rayleigh scattering",
    "d2": "water boils at 100 celsius at sea level",
    "d3": "python lists are ordered and mutable",
}

def score(query, text):
    q = set(query.lower().split())
    t = set(text.lower().split())
    return len(q & t)

def retrieve(query):
    ranked = sorted(DOCS, key=lambda d: score(query, DOCS[d]), reverse=True)
    return ranked[0]

def answer(query):
    doc_id = retrieve(query)
    return "[" + doc_id + "] " + DOCS[doc_id]

for q in ["why is the sky blue", "when does water boil", "are lists mutable"]:
    print(q, "=>", answer(q))
`} />

The answer is a quote from the retrieved chunk plus its id. The model
never invents facts — it is constrained to fetched context.

> **Best practice:** return the source id with every grounded answer; an
> answer with no retrievable source is a hallucination risk to flag.

Next: **RAG Failure Modes**.
````
Deterministic output: `why is the sky blue => [d1] the sky is blue because of rayleigh scattering` / `when does water boil => [d2] water boils at 100 celsius at sea level` / `are lists mutable => [d3] python lists are ordered and mutable`.

**`16-rag-failure-modes.mdx`** — reading, order 3, estMinutes 8, summary "Bad retrieval, stale context, and context-stuffing limits."
Objective: recognise where RAG breaks and the engineering responses.
Outline: irrelevant retrieval → confidently wrong answers; chunk too big/small; stale index; "lost in the middle" / context budget; when to say "not in context" instead of guessing; evaluation preview (recall@k, groundedness — Evaluation module). Best-practice callout: "Make 'I don't have a source for that' a first-class answer; measure retrieval quality, don't assume it." Forward link → **Retrieval & RAG Check**.

**`17-rag-check.mdx`** — quiz, order 4 (stub; review: RAG shape + citations, the retriever you built, RAG failure modes).

---

### Task 4 — Module 5: Memory & State  (`moduleId: "memory"`, module order 5)

Lessons (slugs `18`–`21`):

**`18-why-agents-need-memory.mdx`** — reading, order 1, estMinutes 7, summary "Working memory vs long-term memory; what to keep and why."
Objective: distinguish per-run working memory from cross-run long-term memory and the cost/relevance tradeoffs.
Outline: the loop is stateless without memory; working memory = the running transcript; long-term = facts persisted across runs; context window is finite → you must select/compress; memory as just another tool the policy can read/write. Best-practice callout: "Treat context as a budget: store everything, but *select* what enters the prompt." Forward link → **Conversation Memory**.

**`19-conversation-memory.mdx`** — interactive, order 2, estMinutes 11, summary "Add a transcript + naive summarisation to keep context bounded." Exact body:

````mdx
---
title: "Conversation Memory"
moduleId: "memory"
order: 2
type: "interactive"
summary: "Add a transcript and naive summarisation to keep context bounded."
estMinutes: 11
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** keep a turn transcript, and when it exceeds a budget,
compress the oldest turns into a summary so context stays bounded.

<PyRunner client:visible code={`class Memory:
    def __init__(self, budget):
        self.budget = budget
        self.turns = []
        self.summary = ""

    def add(self, turn):
        self.turns.append(turn)
        if len(self.turns) > self.budget:
            old = self.turns[0]
            self.turns = self.turns[1:]
            self.summary = (self.summary + " | " + old).strip(" |")

    def context(self):
        return "summary=[" + self.summary + "] recent=" + str(self.turns)

m = Memory(budget=2)
for t in ["user:hi", "bot:hello", "user:weather?", "bot:sunny"]:
    m.add(t)
    print(m.context())
`} />

When the transcript exceeds the budget the oldest turn is folded into a
running summary — the same shape as real summarisation, with a trivial
compressor instead of a model call (subsystem D).

> **Best practice:** bound working memory explicitly; compression is a
> policy decision (what to keep) you should be able to test deterministically.

Next: **Memory Pitfalls**.
````
Deterministic output (4 lines): after each add, `summary=[...] recent=[...]` — turn1 `summary=[] recent=['user:hi']`; turn2 `summary=[] recent=['user:hi', 'bot:hello']`; turn3 `summary=[user:hi] recent=['bot:hello', 'user:weather?']`; turn4 `summary=[user:hi | bot:hello] recent=['user:weather?', 'bot:sunny']`.

**`20-memory-pitfalls.mdx`** — reading, order 3, estMinutes 7, summary "Context bloat, lossy summaries, and stale facts."
Objective: the failure modes of memory systems and how to mitigate.
Outline: unbounded transcript → cost/latency blowup + truncation errors; lossy summary drops the fact you needed → keep raw store, summarise the *prompt view*; stale long-term facts → recency/invalidation; privacy of stored memory (preview Guardrails). Best-practice callout: "Summaries are for the prompt, not the system of record — never delete the raw store you can re-derive from." Forward link → **Memory & State Check**.

**`21-memory-check.mdx`** — quiz, order 4 (stub; review: working vs long-term, the bounded transcript+summary you built, memory pitfalls).

---

### Task 5 — Module 6: Planning & Reasoning  (`moduleId: "planning"`, module order 6)

Lessons (slugs `22`–`25`):

**`22-decompose-then-act.mdx`** — reading, order 1, estMinutes 8, summary "Plan-execute and reflection: when single-step ReAct isn't enough."
Objective: explain decomposition (plan then execute steps) and reflection (critique then revise), and when each is worth its cost.
Outline: single-step policy vs multi-step tasks; plan = ordered subgoals; execute each via the agent loop; reflection = evaluate result, revise plan; cost/latency tradeoff vs reliability; deterministic plan for teaching (real planner is a model call, subsystem D). Best-practice callout: "Add planning only when a task reliably needs multiple dependent steps — it multiplies cost and failure surface." Forward link → **A Plan-Execute Loop**.

**`23-a-plan-execute-loop.mdx`** — interactive, order 2, estMinutes 12, summary "Generate a plan, execute each step, collect results." Exact body:

````mdx
---
title: "A Plan-Execute Loop"
moduleId: "planning"
order: 2
type: "interactive"
summary: "Generate a plan, execute each step, and collect the results."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** turn a goal into an ordered plan, execute each step against
a tool, and combine the step results — the plan-execute pattern.

<PyRunner client:visible code={`PLANS = {
    "trip": ["weather", "pack", "book"],
}

def do_step(step):
    return step + ":done"

class MockPlanner:
    def __init__(self, plans):
        self.plans = plans

    def __call__(self, goal):
        return self.plans.get(goal, [])

planner = MockPlanner(PLANS)

def run(goal):
    plan = planner(goal)
    print("plan for", goal, "=", plan)
    results = []
    for step in plan:
        results.append(do_step(step))
    print("results =", results)

run("trip")
`} />

The planner proposes ordered subgoals; the executor runs each step and
collects results. A real planner is a model call with the same shape.

> **Best practice:** keep planning and execution separate — a bad plan
> should be inspectable and replaceable without touching the executor.

Next: **Reflection & Its Limits**.
````
Deterministic output: `plan for trip = ['weather', 'pack', 'book']` then `results = ['weather:done', 'pack:done', 'book:done']`.

**`24-reflection-and-limits.mdx`** — reading, order 3, estMinutes 8, summary "Self-critique loops, when they help, and when they spin."
Objective: reflection patterns and their failure modes (loops, overconfidence, cost).
Outline: critique → revise → retry; bounded reflection (max iterations); reflection can entrench errors if the critic shares the generator's blind spots; cost multiplies; measure whether reflection actually improves task success (Evaluation module). Best-practice callout: "Cap reflection iterations and prove it improves outcomes — unbounded self-critique burns budget for diminishing returns." Forward link → **Planning & Reasoning Check**.

**`25-planning-check.mdx`** — quiz, order 4 (stub; review: plan-execute vs ReAct, the plan-execute loop you built, reflection limits).

---

### Task 6 — Module 7: Multi-Agent Systems  (`moduleId: "multi-agent"`, module order 7)

Lessons (slugs `26`–`29`):

**`26-when-multiple-agents.mdx`** — reading, order 1, estMinutes 8, summary "Roles, supervisor/worker, handoffs — and when one agent is better."
Objective: when decomposition into multiple specialised agents helps vs adds coordination cost; the supervisor/worker pattern.
Outline: a multi-agent system = several policies with roles + a coordinator; supervisor routes subtasks to workers, combines results; handoff = pass observation + scoped goal; shared state risks; YAGNI — most tasks are one agent + tools. Best-practice callout: "Reach for multi-agent only when roles are genuinely distinct; a tool is cheaper than an agent." Forward link → **A Supervisor & Workers**.

**`27-supervisor-and-workers.mdx`** — interactive, order 2, estMinutes 12, summary "Route subtasks from a supervisor to specialised workers." Exact body:

````mdx
---
title: "A Supervisor & Workers"
moduleId: "multi-agent"
order: 2
type: "interactive"
summary: "Route subtasks from a supervisor to specialised worker agents."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** a supervisor routes each subtask to the worker whose role
matches, then combines the workers' results.

<PyRunner client:visible code={`def math_worker(task):
    return "math:" + task

def text_worker(task):
    return "text:" + task

WORKERS = {"math": math_worker, "text": text_worker}

class Supervisor:
    def __init__(self, routes):
        self.routes = routes

    def route(self, task):
        return self.routes.get(task, "text")

sup = Supervisor({"2+2": "math", "summarise": "text"})

def run(tasks):
    out = []
    for t in tasks:
        role = sup.route(t)
        out.append(WORKERS[role](t))
    print(out)

run(["2+2", "summarise", "unknown"])
`} />

The supervisor only decides *who* handles a task; the workers do the work.
Unknown tasks default to the text worker (a safe generalist).

> **Best practice:** give the supervisor one job — routing — and keep
> workers independently testable. Coordination logic and work must not mix.

Next: **Coordination Failure Modes**.
````
Deterministic output: `['math:2+2', 'text:summarise', 'text:unknown']`.

**`28-coordination-failures.mdx`** — reading, order 3, estMinutes 8, summary "Deadlock, lost messages, and cost explosions in agent teams."
Objective: the failure modes unique to multi-agent systems and mitigations.
Outline: handoff loops/deadlock → step + depth budgets; shared-state races → single writer / message passing; cost multiplies per agent; debugging is harder → trace every handoff (Observability module); a flat tool often beats a worker. Best-practice callout: "Budget total steps across the whole team, not per agent — multi-agent cost compounds." Forward link → **Multi-Agent Systems Check**.

**`29-multi-agent-check.mdx`** — quiz, order 4 (stub; review: supervisor/worker pattern, the router you built, coordination failure modes).

---

### Task 7 — Module 8: Evaluation & Testing  (`moduleId: "evaluation"`, module order 8)

Lessons (slugs `30`–`33`):

**`30-how-to-measure-an-agent.mdx`** — reading, order 1, estMinutes 8, summary "Task success vs trajectory: what to measure and why."
Objective: define task-success metrics vs trajectory/process metrics and why agents need both.
Outline: deterministic checks (did it produce the right answer/effect) vs trajectory (did it use the right tools/steps); golden test sets; regression suites in CI; LLM-as-judge (conceptual, its biases — subsystem D); offline eval before shipping. Best-practice callout: "An agent without a regression suite is unshippable — pin behaviour with cases, not vibes." Forward link → **An Eval Harness**.

**`31-an-eval-harness.mdx`** — interactive, order 2, estMinutes 12, summary "Score an agent against a golden set; compute pass rate." Exact body:

````mdx
---
title: "An Eval Harness"
moduleId: "evaluation"
order: 2
type: "interactive"
summary: "Score an agent against a golden set and compute the pass rate."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** run an agent over a labelled set of cases and compute a
pass rate — the smallest useful evaluation.

<PyRunner client:visible code={`class MockLLM:
    def __init__(self, table):
        self.table = table

    def __call__(self, prompt):
        return self.table.get(prompt, "unknown")

agent = MockLLM({
    "2+2": "4",
    "capital of france": "paris",
    "color of sky": "green",
})

GOLDEN = [
    ("2+2", "4"),
    ("capital of france", "paris"),
    ("color of sky", "blue"),
]

def evaluate(model, cases):
    passed = 0
    for prompt, expected in cases:
        got = model(prompt)
        ok = got == expected
        if ok:
            passed = passed + 1
        print(prompt, "expected", expected, "got", got, "->", ok)
    print("pass rate =", passed, "/", len(cases))

evaluate(agent, GOLDEN)
`} />

The harness is just: run every case, compare to the label, aggregate.
Everything sophisticated (judges, trajectory checks) is a richer
comparator with this same loop.

> **Best practice:** start every agent with a tiny golden set and a pass
> rate in CI; grow the set from every production failure.

Next: **Evaluation Pitfalls**.
````
Deterministic output: 3 case lines (`2+2 expected 4 got 4 -> True`, `capital of france expected paris got paris -> True`, `color of sky expected blue got green -> False`) then `pass rate = 2 / 3`.

**`32-evaluation-pitfalls.mdx`** — reading, order 3, estMinutes 8, summary "Overfitting to the eval set, judge bias, and flaky cases."
Objective: ways evaluation misleads and how to keep it honest.
Outline: overfitting the prompt to the golden set; non-deterministic cases → flaky CI (control temperature/seed conceptually, subsystem D); LLM-judge bias/variance; eval set drift vs production; measure trajectory not just final answer for agentic tasks. Best-practice callout: "Hold out cases the prompt author never sees; a metric you optimise against stops measuring." Forward link → **Evaluation & Testing Check**.

**`33-evaluation-check.mdx`** — quiz, order 4 (stub; review: task vs trajectory metrics, the harness you built, evaluation pitfalls).

---

### Task 8 — Module 9: Guardrails & Safety  (`moduleId: "guardrails"`, module order 9)

Lessons (slugs `34`–`37`):

**`34-input-output-guardrails.mdx`** — reading, order 1, estMinutes 8, summary "Validate what goes into and comes out of the policy."
Objective: the guardrail layers around an agent (input validation, output validation, tool-call authorisation).
Outline: untrusted inputs (user + tool/retrieved data); validate/normalise before the policy; validate the action before executing; allow/deny tool policies; defence in depth; guardrails are deterministic code around a non-deterministic core. Best-practice callout: "The model is untrusted; everything it consumes and emits passes a validation boundary you own." Forward link → **A Guardrail Layer**.

**`35-a-guardrail-layer.mdx`** — interactive, order 2, estMinutes 11, summary "Block disallowed tools and unsafe args before execution." Exact body:

````mdx
---
title: "A Guardrail Layer"
moduleId: "guardrails"
order: 2
type: "interactive"
summary: "Block disallowed tools and unsafe arguments before execution."
estMinutes: 11
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** put a deterministic check between the policy's chosen
action and execution: only allow-listed tools, and reject unsafe args.

<PyRunner client:visible code={`ALLOWED = {"search", "calc"}

def guard(action):
    name, _, arg = action.partition(":")
    name = name.strip()
    arg = arg.strip()
    if name not in ALLOWED:
        return ("blocked", "tool_not_allowed")
    if ".." in arg or "/" in arg:
        return ("blocked", "unsafe_arg")
    return ("ok", name + "(" + arg + ")")

for a in ["search: cats", "delete: db", "calc: 2+2", "search: ../etc"]:
    print(a, "=>", guard(a))
`} />

The policy may *propose* anything; the guardrail decides what actually
runs. Blocking returns a defined result the loop can handle — it never
throws.

> **Best practice:** allow-list, don't deny-list; validate arguments
> structurally; a blocked action is a normal, logged outcome.

Next: **Prompt Injection & Safe Tools**.
````
Deterministic output: `search: cats => ('ok', 'search(cats)')` / `delete: db => ('blocked', 'tool_not_allowed')` / `calc: 2+2 => ('ok', 'calc(2+2)')` / `search: ../etc => ('blocked', 'unsafe_arg')`.

**`36-injection-and-safe-tools.mdx`** — reading, order 3, estMinutes 8, summary "Prompt injection via data, and executing tools with least privilege."
Objective: prompt-injection threat model and least-privilege tool execution.
Outline: injection through retrieved/tool/user content (the model can't be trusted to ignore instructions in data); isolate data from instructions; least-privilege tools (no raw shell/SQL/eval; scoped credentials — real wiring subsystem D); human-in-the-loop for high-impact actions; log + rate-limit. Best-practice callout: "Treat all model-adjacent text as hostile data; high-impact tools require authorisation outside the model." Forward link → **Guardrails & Safety Check**.

**`37-guardrails-check.mdx`** — quiz, order 4 (stub; review: input/output validation boundary, the guardrail you built, injection + least privilege).

---

### Task 9 — Module 10: Cost, Latency & Reliability  (`moduleId: "reliability"`, module order 10)

Lessons (slugs `38`–`41`):

**`38-budgets-and-caching.mdx`** — reading, order 1, estMinutes 8, summary "Token/cost models, caching, and why every loop needs a budget."
Objective: the cost/latency model of agent loops and the first levers (budgets, caching).
Outline: each step = tokens = money + latency; loops multiply cost; a hard step/token budget per run; caching identical calls; batching; the cheapest call is the one you don't make. Best-practice callout: "Every agent run carries an explicit budget; exceeding it degrades gracefully, it doesn't run forever." Forward link → **Caching & Budgets**.

**`39-caching-and-budgets.mdx`** — interactive, order 2, estMinutes 11, summary "Add a response cache and a hard call budget to the loop." Exact body:

````mdx
---
title: "Caching & Budgets"
moduleId: "reliability"
order: 2
type: "interactive"
summary: "Add a response cache and a hard call budget to the loop."
estMinutes: 11
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** wrap the policy with a cache (skip repeat calls) and a hard
budget (stop before runaway cost).

<PyRunner client:visible code={`class Budgeted:
    def __init__(self, table, budget):
        self.table = table
        self.budget = budget
        self.calls = 0
        self.cache = {}

    def __call__(self, prompt):
        if prompt in self.cache:
            return self.cache[prompt] + " (cached)"
        if self.calls >= self.budget:
            return "budget_exceeded"
        self.calls = self.calls + 1
        out = self.table.get(prompt, "unknown")
        self.cache[prompt] = out
        return out

llm = Budgeted({"a": "1", "b": "2"}, budget=2)
for p in ["a", "a", "b", "c"]:
    print(p, "->", llm(p))
`} />

A repeated prompt is served from cache (no spend). Once the budget of
fresh calls is hit, further new prompts degrade to `budget_exceeded`
instead of costing more.

> **Best practice:** cache by exact input, count only uncached calls
> against the budget, and make budget exhaustion a defined response.

Next: **Timeouts, Retries & Fallback**.
````
Deterministic output: `a -> 1` / `a -> 1 (cached)` / `b -> 2` / `c -> budget_exceeded`.

**`40-timeouts-retries-fallback.mdx`** — reading, order 3, estMinutes 8, summary "Bounded retries, timeouts, and graceful degradation."
Objective: reliability patterns for unreliable model/tool calls.
Outline: timeouts on every external call (real wiring subsystem D); bounded ret(exponential backoff conceptually); idempotency for safe retry; fallback model/answer; circuit-breaking; degrade to a useful partial answer. Best-practice callout: "Every external call has a timeout, a retry cap, and a fallback — no unbounded waits, ever." Forward link → **Cost, Latency & Reliability Check**.

**`41-reliability-check.mdx`** — quiz, order 4 (stub; review: budgets, the cache+budget wrapper you built, timeouts/retries/fallback).

---

### Task 10 — Module 11: Observability & Debugging  (`moduleId: "observability"`, module order 11)

Lessons (slugs `42`–`45`):

**`42-tracing-the-loop.mdx`** — reading, order 1, estMinutes 8, summary "You can't debug what you can't see: structured traces of each step."
Objective: why agent debugging requires structured per-step traces (input, decision, tool, result) and replayable trajectories.
Outline: non-determinism makes print-debugging useless; capture a structured event per step; a trajectory = the ordered events of a run; replay a failed trajectory deterministically; correlation ids; metrics from traces. Best-practice callout: "Emit one structured event per loop step from day one; a run you can't replay is a run you can't fix." Forward link → **A Trace Recorder**.

**`43-a-trace-recorder.mdx`** — interactive, order 2, estMinutes 11, summary "Record a structured trace of each loop step and replay it." Exact body:

````mdx
---
title: "A Trace Recorder"
moduleId: "observability"
order: 2
type: "interactive"
summary: "Record a structured trace of each loop step, then replay it."
estMinutes: 11
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** wrap a step so every decision is recorded as a structured
event; the recorded trace can be printed and replayed.

<PyRunner client:visible code={`class Tracer:
    def __init__(self):
        self.events = []

    def step(self, obs, action):
        self.events.append({"obs": obs, "action": action})
        return action

def policy(obs):
    if "error" in obs:
        return "retry"
    return "answer"

t = Tracer()
for obs in ["ok input", "error here", "ok again"]:
    a = t.step(obs, policy(obs))
    print("step:", obs, "->", a)

print("trace length =", len(t.events))
print("recorded actions:", [e["action"] for e in t.events])
`} />

Each step appends a structured event. The trace is data: you can print
it, assert on it in tests, or replay the action sequence.

> **Best practice:** the trace is the debugging interface and the eval
> input — structure it as data, never as free-form log strings.

Next: **Debugging From Traces**.
````
Deterministic output: `step: ok input -> answer` / `step: error here -> retry` / `step: ok again -> answer` / `trace length = 3` / `recorded actions: ['answer', 'retry', 'answer']`.

**`44-debugging-from-traces.mdx`** — reading, order 3, estMinutes 7, summary "From a failed trajectory to a root cause and a regression case."
Objective: the workflow from a captured failure to a fix that stays fixed.
Outline: reproduce from the trace; localise the bad step (perception? policy? tool?); turn the trajectory into a golden/regression case (ties to Evaluation); dashboards/alerts on trace metrics (real backends subsystem D). Best-practice callout: "Every production failure becomes a replayed trace and a new regression case before it's closed." Forward link → **Observability & Debugging Check**.

**`45-observability-check.mdx`** — quiz, order 4 (stub; review: structured traces/trajectories, the recorder you built, trace→regression workflow).

---

### Task 11 — Module 12: Production & Deployment  (`moduleId: "production"`, module order 12)

Lessons (slugs `46`–`49`):

**`46-shipping-an-agent.mdx`** — reading, order 1, estMinutes 9, summary "Statelessness, real-API integration, config, and rollout."
Objective: what changes when the agent leaves the notebook — statelessness, real model/tool wiring, config/secrets, rollout.
Outline: stateless handlers + externalised memory/state (Memory module); real API integration is where subsystem D plugs into the seam you've used all along; secrets/config; canary/staged rollout; everything from prior modules (budgets, guardrails, traces, evals) is a launch requirement, not optional. Best-practice callout: "The seam you mocked since Module 1 is the exact swap point for real models — production changes the implementation behind it, not your loop." Forward link → **A Production-Shaped Handler**.

**`47-a-production-handler.mdx`** — interactive, order 2, estMinutes 12, summary "A stateless handler: budget + guardrail + trace around the policy." Exact body:

````mdx
---
title: "A Production-Shaped Handler"
moduleId: "production"
order: 2
type: "interactive"
summary: "A stateless handler composing budget, guardrail, and trace."
estMinutes: 12
---

import PyRunner from "../../components/PyRunner.tsx";

**Objective:** compose the whole course — a stateless `handle(request)`
that budgets, guards, runs the policy, and returns a structured result.
Swapping the mock for a real model (subsystem D) changes nothing here.

<PyRunner client:visible code={`ALLOWED = {"search", "answer"}

def policy(req):
    if "weather" in req:
        return "search: weather"
    return "answer: ok"

def guard(action):
    name = action.split(":")[0].strip()
    return name in ALLOWED

def handle(request, budget):
    if budget <= 0:
        return {"status": "rejected", "reason": "no_budget"}
    action = policy(request)
    if not guard(action):
        return {"status": "blocked", "action": action}
    return {"status": "ok", "action": action, "trace": [request, action]}

for req, b in [("weather?", 1), ("hello", 1), ("weather?", 0)]:
    print(handle(req, b))
`} />

`handle` is stateless: inputs in, structured result out, every cross-
cutting concern (budget, guardrail, trace) applied. Production swaps
`policy` for a real model behind the same call.

> **Best practice:** the request handler is pure orchestration of the
> patterns you already built — keep it stateless and return structured
> results, never raw model text.

Next: **Production & Deployment Check**.
````
Deterministic output: `{'status': 'ok', 'action': 'search: weather', 'trace': ['weather?', 'search: weather']}` / `{'status': 'ok', 'action': 'answer: ok', 'trace': ['hello', 'answer: ok']}` / `{'status': 'rejected', 'reason': 'no_budget'}`.

**`48-going-further.mdx`** — reading, order 3, estMinutes 7, summary "Capstone framing and where real APIs/frameworks come in."
Objective: synthesise the curriculum and point to the real-integration next step (subsystem D) and a capstone.
Outline: recap the loop → policy seam → tools → RAG → memory → planning → multi-agent → eval → guardrails → reliability → observability; the capstone = compose them for one real task; real model/framework integration is subsystem D (same seam); keep durable principles as SDKs churn. Best-practice callout: "Frameworks change; the loop, the seam, evals, and guardrails don't — those are the job." Forward link → **Production & Deployment Check**.

**`49-production-check.mdx`** — quiz, order 4 (stub; review: stateless handler composition, the handler you built, the durable principles recap).

---

## Self-Review

**Spec coverage:** The approved E spec's authoritative 12-module map → Modules 2–12 here exactly match the map ids/titles/order; Module 1 (Foundations) already shipped. Each module: concept reading + from-scratch interactive against the mock seam + best-practices reading + quiz stub — matches the spec's content conventions and the Foundations template. Mock-LLM seam reused throughout (spec requirement). Real APIs/frameworks consistently tagged "(real integration: subsystem D)" (spec requirement). Out-of-scope (subsystems A/C/D, real execution) respected — pure content. No framework code change (spec requirement).

**Placeholder scan:** No TBD/TODO. Every interactive lesson has its exact, deterministic, stdlib-only Python with stated expected output and a normalization-check step. Reading lessons specify exact frontmatter + objective + a concrete substance outline + the best-practice callout content + the forward link target — for prose content the outline + locked conventions are the implementable spec (the skill's anti-over-engineering / decomposition guidance: proportionate detail for uniform content). Quiz lessons use the one standard stub template with per-module substitutions stated.

**Consistency:** `moduleId`s match the `modules.ts` table exactly; within-module `order` is 1–4 for every module; global slug prefixes `06`–`49` are unique and contiguous; every interactive lesson's Python uses shallow nesting (≤2 levels) so the 4→2-space MDX normalization stays valid Python (verified per task in Step 7); forward links chain (each module's lesson 1→2→3→4; lesson 3 → next module's lesson 1; Module 12 lesson 3 → its quiz). Foundations lessons/slugs/`02-the-agent-loop` PyRunner anchor are untouched, so the existing 7 e2e tests stay valid (controller re-runs the authoritative networked e2e after the final module).

No gaps.
