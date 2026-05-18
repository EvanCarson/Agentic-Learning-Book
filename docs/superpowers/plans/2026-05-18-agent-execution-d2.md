# Subsystem D Cycle 2 — Broaden Real-Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring BYO-key real-model execution to the 6 interactive lessons with a genuine model-decision seam, keeping each lesson's deterministic mock output byte-identical.

**Architecture:** A minimal *additive* PolicyRunner change injects two Pyodide globals (`alb_real_mode`, `alb_call_model`); the existing `policy`/`mockAgentLoopPolicy` injection is untouched so `02-the-agent-loop` is unaffected. Each of the 6 lessons swaps `PyRunner`→`PolicyRunner` and changes only its model-decision call site to branch on `alb_real_mode` — the **mock branch runs the lesson's original mock expression verbatim** (byte-identical by construction). A deterministic per-lesson mock-parity test plus one representative networked e2e guard it; no real-model call runs in CI.

**Tech Stack:** Astro 6 (MDX), React 19 islands, Pyodide (`runPythonAsync` — supports top-level await), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-18-agent-execution-d2-design.md`

---

## File Structure

- **Modify** `src/components/PolicyRunner.tsx` — add 2 injected globals in `run()` (additive; existing `policy` injection unchanged).
- **Modify** 6 lesson MDX (each: `PyRunner`→`PolicyRunner` import+tag, call-site branch, `INSTR` const, prose note; everything else verbatim):
  `03-the-mock-llm`, `07-structured-output`, `11-a-tool-using-loop`, `27-supervisor-and-workers`, `47-a-production-handler`, `23-a-plan-execute-loop`.
- **Create** `tests/d2-mock-parity.test.ts` — deterministic guard: each reworked lesson's snippet, 2-space-normalized, run in mock mode (`alb_real_mode=False`, stub `alb_call_model` that raises), stdout asserted byte-identical to a per-lesson expected string.
- **Modify** `e2e/site.spec.ts` — add one networked all-mock Playwright test on `03-the-mock-llm`; the existing `02-the-agent-loop` anchor stays unchanged.

## Conventions for every lesson task

- The **mock branch is the lesson's original decision expression, verbatim**. Only: change `import PyRunner ... PyRunner.tsx` → `import PolicyRunner ... PolicyRunner.tsx`, `<PyRunner` → `<PolicyRunner`, add an `INSTR` constant + (27/23 only) a tiny parse helper, make the function performing the model call `async def` and `await` it (Pyodide `runPythonAsync` supports top-level `await`), and add one prose line.
- **Prose note** — immediately after the closing `/>` of the `<PolicyRunner ... />` component, on its own paragraph, add exactly: `Mock is the default and free. Switch the **Model** toggle above to **Real (your key)** to run this same code on your own OpenAI-compatible model.`
- Frontmatter (`title`/`moduleId`/`order`/`type`/`summary`/`estMinutes`) and slug unchanged. Plain ASCII in the snippet. File ends with a trailing newline.
- **Per-task gate:** `npx astro check` (0/0/0); `npm run build` (green, 51 pages); the task's mock-parity command prints the expected stdout **byte-identical**; `npx vitest run` unaffected (until Task 8 adds the parity test). Then commit only that lesson file.

---

### Task 0: Branch

- [ ] **Step 1:** `git rev-parse --abbrev-ref HEAD` → expect `agent-execution-d2`. If not, `git checkout agent-execution-d2`. Never implement on `main`.

---

### Task 1: PolicyRunner — additive injected globals

**Files:** Modify `src/components/PolicyRunner.tsx`

- [ ] **Step 1:** Read `src/components/PolicyRunner.tsx`. Locate, inside `run()`, the existing block (D1):
```ts
      const cfg = getModelConfig();
      const policy = async (observation: string): Promise<string> =>
        cfg.mode === "real" && cfg.apiKey
          ? callRealModel(observation, cfg)
          : mockAgentLoopPolicy(observation);
      pyodide.globals.set("policy", policy);
```

- [ ] **Step 2:** Immediately AFTER `pyodide.globals.set("policy", policy);` add (additive — do not modify the lines above; `callRealModel`/`getModelConfig` are already imported in this file):
```ts
      pyodide.globals.set(
        "alb_real_mode",
        cfg.mode === "real" && !!cfg.apiKey,
      );
      pyodide.globals.set(
        "alb_call_model",
        async (prompt: string): Promise<string> => callRealModel(prompt, cfg),
      );
```

- [ ] **Step 3:** `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx astro check` → 0 errors / 0 warnings / 0 hints. `npm run build` → green, 51 pages.

- [ ] **Step 4: Authoritative networked e2e — lesson 02 anchor must be unaffected (MANDATORY).** PolicyRunner's live test needs the Pyodide CDN; the Bash sandbox blocks network — run with the Bash tool's `dangerouslyDisableSandbox: true`:
`CI=1 npx playwright test --reporter=list`
Expected: all current tests pass (the `interactive lesson runs Python in-browser` anchor on `02-the-agent-loop` and the quiz Tool-Use anchor in particular — lesson 02 still uses the unchanged `policy` global, so its mock output is unchanged). If ONLY a Pyodide test fails with a CDN/network/timeout to `cdn.jsdelivr.net`, retry once; if still only that and environmental, report DONE_WITH_CONCERNS with the output and confirm all non-Pyodide tests passed. Any assertion failure → BLOCKED.

- [ ] **Step 5: Commit**
```bash
git add src/components/PolicyRunner.tsx
git commit -m "feat(d): PolicyRunner injects alb_real_mode + alb_call_model (additive)"
```

---

### Task 2: `03-the-mock-llm`

**Files:** Modify `src/content/lessons/03-the-mock-llm.mdx`

**Pre-rework mock stdout (the byte-identical baseline — must not change):**
```
prompt='weather in nyc?' -> 'tool:get_weather'
prompt='say hi' -> 'answer:hello'
prompt='unknown request' -> 'answer:i_dont_know'
```

- [ ] **Step 1:** Change the import line `import PyRunner from "../../components/PyRunner.tsx";` → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the entire `<PyRunner client:visible code={`...`} />` element with EXACTLY (note `agent_step` is now `async`, awaited; the mock branch `llm(prompt)` is verbatim; `policy = MockLLM(...)` local var is unchanged and intentionally shadows the injected `policy` global in mock mode):
```mdx
<PolicyRunner client:visible code={`INSTR = "Reply with exactly 'tool:<name>' or 'answer:<text>'. Prompt: "

class MockLLM:
    def __init__(self, table):
        self.table = table

    def __call__(self, prompt):
        return self.table.get(prompt, "answer:i_dont_know")

policy = MockLLM({
    "weather in nyc?": "tool:get_weather",
    "say hi": "answer:hello",
})

async def agent_step(prompt, llm):
    decision = (await alb_call_model(INSTR + prompt)) if alb_real_mode else llm(prompt)
    print(f"prompt={prompt!r} -> {decision!r}")

for p in ["weather in nyc?", "say hi", "unknown request"]:
    await agent_step(p, policy)
`} />
```

- [ ] **Step 3:** Immediately after that `/>`, ensure the prose note paragraph (exact text from "Conventions") is present on its own line. (If a similar sentence already exists, replace it with the exact conventions text; do not duplicate.)

- [ ] **Step 4: Mock-parity check** (run from repo root):
```
python3 - <<'PY'
import re,subprocess,sys
s=open("src/content/lessons/03-the-mock-llm.mdx").read()
code=re.search(r"<PolicyRunner client:visible code=\{`([\s\S]*?)`\}\s*/>",s).group(1)
norm="\n".join((" "*((len(l)-len(l.lstrip(' ')))//2)+l.lstrip(' ')) for l in code.split("\n"))
harness="import asyncio\nalb_real_mode=False\nasync def alb_call_model(p):\n raise AssertionError('real model called in mock mode')\nasync def __m():\n"+ "".join(" "+ln+"\n" for ln in norm.split("\n")) + "\nasyncio.run(__m())\n"
print(subprocess.run([sys.executable,"-c",harness],capture_output=True,text=True).stdout,end="")
PY
```
Expected output EXACTLY:
```
prompt='weather in nyc?' -> 'tool:get_weather'
prompt='say hi' -> 'answer:hello'
prompt='unknown request' -> 'answer:i_dont_know'
```
If it differs, the mock path was altered — fix the snippet (mock branch must be verbatim) until byte-identical. Do not edit the harness.

- [ ] **Step 5:** `npx astro check` → 0/0/0; `npm run build` → green, 51 pages.

- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/03-the-mock-llm.mdx
git commit -m "feat(d): 03-the-mock-llm on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 3: `07-structured-output`

**Files:** Modify `src/content/lessons/07-structured-output.mdx`

**Pre-rework mock stdout (baseline):**
```
weather in nyc? => ('TOOL', 'get_weather')
say hi => ('ANSWER', 'hello')
garbled => ('ANSWER', 'unparseable')
```

- [ ] **Step 1:** import line → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the `<PyRunner ... />` element with EXACTLY (mock branch `llm(prompt)` verbatim; a new `async def decide` wraps the call; `parse_action`/`VALID`/`MockLLM`/`llm` table unchanged):
```mdx
<PolicyRunner client:visible code={`INSTR = "Reply with exactly 'TOOL: <arg>' or 'ANSWER: <text>'. Prompt: "

VALID = {"TOOL", "ANSWER"}

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

async def decide(prompt):
    return (await alb_call_model(INSTR + prompt)) if alb_real_mode else llm(prompt)

for prompt in ["weather in nyc?", "say hi", "garbled"]:
    print(prompt, "=>", parse_action(await decide(prompt)))
`} />
```

- [ ] **Step 3:** Ensure the exact prose note paragraph is present after `/>` (replace any prior similar line; no duplicate).

- [ ] **Step 4: Mock-parity check** (same harness, substitute the path):
```
python3 - <<'PY'
import re,subprocess,sys
s=open("src/content/lessons/07-structured-output.mdx").read()
code=re.search(r"<PolicyRunner client:visible code=\{`([\s\S]*?)`\}\s*/>",s).group(1)
norm="\n".join((" "*((len(l)-len(l.lstrip(' ')))//2)+l.lstrip(' ')) for l in code.split("\n"))
harness="import asyncio\nalb_real_mode=False\nasync def alb_call_model(p):\n raise AssertionError('real model called in mock mode')\nasync def __m():\n"+ "".join(" "+ln+"\n" for ln in norm.split("\n")) + "\nasyncio.run(__m())\n"
print(subprocess.run([sys.executable,"-c",harness],capture_output=True,text=True).stdout,end="")
PY
```
Expected EXACTLY:
```
weather in nyc? => ('TOOL', 'get_weather')
say hi => ('ANSWER', 'hello')
garbled => ('ANSWER', 'unparseable')
```

- [ ] **Step 5:** `npx astro check` 0/0/0; `npm run build` green 51 pages.
- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/07-structured-output.mdx
git commit -m "feat(d): 07-structured-output on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 4: `11-a-tool-using-loop`

**Files:** Modify `src/content/lessons/11-a-tool-using-loop.mdx`

**Pre-rework mock stdout (baseline):**
```
weather in paris -> tool get_weather -> sunny in paris
two plus three -> tool add -> 5
hello -> answer -> hi
```

- [ ] **Step 1:** import line → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the `<PyRunner ... />` element with EXACTLY (mock branch `llm(prompt)` verbatim; `run` becomes `async def`, awaited):
```mdx
<PolicyRunner client:visible code={`INSTR = "Reply with exactly '<tool>: <arg>' or 'answer: <text>'. Prompt: "

def get_weather(city):
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

async def run(prompt, llm):
    decision = (await alb_call_model(INSTR + prompt)) if alb_real_mode else llm(prompt)
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
    await run(p, llm)
`} />
```

- [ ] **Step 3:** Ensure exact prose note after `/>` (replace prior similar; no duplicate).
- [ ] **Step 4: Mock-parity check** (same harness; path `src/content/lessons/11-a-tool-using-loop.mdx`). Expected EXACTLY:
```
weather in paris -> tool get_weather -> sunny in paris
two plus three -> tool add -> 5
hello -> answer -> hi
```
- [ ] **Step 5:** `npx astro check` 0/0/0; `npm run build` green 51 pages.
- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/11-a-tool-using-loop.mdx
git commit -m "feat(d): 11-a-tool-using-loop on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 5: `27-supervisor-and-workers`

**Files:** Modify `src/content/lessons/27-supervisor-and-workers.mdx`

**Pre-rework mock stdout (baseline):**
```
['math:2+2', 'text:summarise', 'text:unknown']
```

- [ ] **Step 1:** import line → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the `<PyRunner ... />` element with EXACTLY (mock branch `sup.route(t)` verbatim; real branch maps free text to a role via `parse_role`, falling back to the lesson's existing default `"text"`):
```mdx
<PolicyRunner client:visible code={`INSTR = "Classify the task as exactly the single word 'math' or 'text'. Task: "

def math_worker(task):
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

def parse_role(resp):
    return "math" if "math" in resp.lower() else "text"

async def run(tasks):
    out = []
    for t in tasks:
        role = parse_role(await alb_call_model(INSTR + t)) if alb_real_mode else sup.route(t)
        out.append(WORKERS[role](t))
    print(out)

await run(["2+2", "summarise", "unknown"])
`} />
```

- [ ] **Step 3:** Ensure exact prose note after `/>` (replace prior similar; no duplicate).
- [ ] **Step 4: Mock-parity check** (same harness; path `src/content/lessons/27-supervisor-and-workers.mdx`). Expected EXACTLY:
```
['math:2+2', 'text:summarise', 'text:unknown']
```
- [ ] **Step 5:** `npx astro check` 0/0/0; `npm run build` green 51 pages.
- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/27-supervisor-and-workers.mdx
git commit -m "feat(d): 27-supervisor-and-workers on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 6: `47-a-production-handler`

**Files:** Modify `src/content/lessons/47-a-production-handler.mdx`

**Pre-rework mock stdout (baseline):**
```
{'status': 'ok', 'action': 'search: weather', 'trace': ['weather?', 'search: weather']}
{'status': 'ok', 'action': 'answer: ok', 'trace': ['hello', 'answer: ok']}
{'status': 'rejected', 'reason': 'no_budget'}
```

- [ ] **Step 1:** import line → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the `<PyRunner ... />` element with EXACTLY (mock branch `policy(request)` verbatim; `handle` becomes `async def`, awaited; the budget check still precedes the call so a zero budget returns rejected without a model call — mock output unchanged):
```mdx
<PolicyRunner client:visible code={`INSTR = "Reply with exactly 'search: <arg>' or 'answer: <text>'. Request: "

ALLOWED = {"search", "answer"}

def policy(req):
    if "weather" in req:
        return "search: weather"
    return "answer: ok"

def guard(action):
    name = action.split(":")[0].strip()
    return name in ALLOWED

async def handle(request, budget):
    if budget <= 0:
        return {"status": "rejected", "reason": "no_budget"}
    action = (await alb_call_model(INSTR + request)) if alb_real_mode else policy(request)
    if not guard(action):
        return {"status": "blocked", "action": action}
    return {"status": "ok", "action": action, "trace": [request, action]}

for req, b in [("weather?", 1), ("hello", 1), ("weather?", 0)]:
    print(await handle(req, b))
`} />
```

- [ ] **Step 3:** Ensure exact prose note after `/>` (replace prior similar; no duplicate).
- [ ] **Step 4: Mock-parity check** (same harness; path `src/content/lessons/47-a-production-handler.mdx`). Expected EXACTLY:
```
{'status': 'ok', 'action': 'search: weather', 'trace': ['weather?', 'search: weather']}
{'status': 'ok', 'action': 'answer: ok', 'trace': ['hello', 'answer: ok']}
{'status': 'rejected', 'reason': 'no_budget'}
```
- [ ] **Step 5:** `npx astro check` 0/0/0; `npm run build` green 51 pages.
- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/47-a-production-handler.mdx
git commit -m "feat(d): 47-a-production-handler on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 7: `23-a-plan-execute-loop` (heaviest — list-returning policy)

**Files:** Modify `src/content/lessons/23-a-plan-execute-loop.mdx`

**Pre-rework mock stdout (baseline):**
```
plan for trip = ['weather', 'pack', 'book']
results = ['weather:done', 'pack:done', 'book:done']
```

- [ ] **Step 1:** import line → `import PolicyRunner from "../../components/PolicyRunner.tsx";`

- [ ] **Step 2:** Replace the `<PyRunner ... />` element with EXACTLY (mock branch `planner(goal)` verbatim — returns a list; real branch parses comma-separated model text into a list via `parse_plan`, falling back to the lesson's existing default `[]`; `run` becomes `async def`, awaited):
```mdx
<PolicyRunner client:visible code={`INSTR = "List the plan steps for the goal as a short comma-separated list, steps only. Goal: "

PLANS = {
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

def parse_plan(resp):
    return [s.strip() for s in resp.split(",") if s.strip()]

async def run(goal):
    plan = parse_plan(await alb_call_model(INSTR + goal)) if alb_real_mode else planner(goal)
    print("plan for", goal, "=", plan)
    results = []
    for step in plan:
        results.append(do_step(step))
    print("results =", results)

await run("trip")
`} />
```

- [ ] **Step 3:** Ensure exact prose note after `/>` (replace prior similar; no duplicate).
- [ ] **Step 4: Mock-parity check** (same harness; path `src/content/lessons/23-a-plan-execute-loop.mdx`). Expected EXACTLY:
```
plan for trip = ['weather', 'pack', 'book']
results = ['weather:done', 'pack:done', 'book:done']
```
- [ ] **Step 5:** `npx astro check` 0/0/0; `npm run build` green 51 pages.
- [ ] **Step 6: Commit**
```bash
git add src/content/lessons/23-a-plan-execute-loop.mdx
git commit -m "feat(d): 23-a-plan-execute-loop on PolicyRunner real-mode seam (mock unchanged)"
```

---

### Task 8: Consolidated deterministic mock-parity guard

**Files:** Create `tests/d2-mock-parity.test.ts`

- [ ] **Step 1:** Create `tests/d2-mock-parity.test.ts` with EXACTLY:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const LESSONS = fileURLToPath(new URL("../src/content/lessons", import.meta.url));

// Each reworked D2 lesson: its expected byte-identical MOCK-mode stdout.
const EXPECTED: Record<string, string> = {
  "03-the-mock-llm.mdx":
    "prompt='weather in nyc?' -> 'tool:get_weather'\n" +
    "prompt='say hi' -> 'answer:hello'\n" +
    "prompt='unknown request' -> 'answer:i_dont_know'\n",
  "07-structured-output.mdx":
    "weather in nyc? => ('TOOL', 'get_weather')\n" +
    "say hi => ('ANSWER', 'hello')\n" +
    "garbled => ('ANSWER', 'unparseable')\n",
  "11-a-tool-using-loop.mdx":
    "weather in paris -> tool get_weather -> sunny in paris\n" +
    "two plus three -> tool add -> 5\n" +
    "hello -> answer -> hi\n",
  "27-supervisor-and-workers.mdx":
    "['math:2+2', 'text:summarise', 'text:unknown']\n",
  "47-a-production-handler.mdx":
    "{'status': 'ok', 'action': 'search: weather', 'trace': ['weather?', 'search: weather']}\n" +
    "{'status': 'ok', 'action': 'answer: ok', 'trace': ['hello', 'answer: ok']}\n" +
    "{'status': 'rejected', 'reason': 'no_budget'}\n",
  "23-a-plan-execute-loop.mdx":
    "plan for trip = ['weather', 'pack', 'book']\n" +
    "results = ['weather:done', 'pack:done', 'book:done']\n",
};

function mockStdout(file: string): string {
  const src = readFileSync(`${LESSONS}/${file}`, "utf8");
  const m = src.match(
    /<PolicyRunner client:visible code=\{`([\s\S]*?)`\}\s*\/>/,
  );
  if (!m) throw new Error(`${file}: no PolicyRunner snippet`);
  // MDX halves leading indentation (4->2, 8->6) before Pyodide runs it.
  const norm = m[1]
    .split("\n")
    .map((l) => {
      const i = l.length - l.replace(/^ +/, "").length;
      return " ".repeat(Math.floor(i / 2)) + l.slice(i);
    })
    .join("\n");
  // Mock mode: alb_real_mode False, alb_call_model must never be called.
  const indented = norm
    .split("\n")
    .map((l) => " " + l)
    .join("\n");
  const harness =
    "import asyncio\n" +
    "alb_real_mode=False\n" +
    "async def alb_call_model(p):\n" +
    " raise AssertionError('real model called in mock mode')\n" +
    "async def __m():\n" +
    indented +
    "\nasyncio.run(__m())\n";
  return execFileSync("python3", ["-c", harness], { encoding: "utf8" });
}

describe("D2 mock-parity (byte-identical mock output)", () => {
  for (const [file, expected] of Object.entries(EXPECTED)) {
    it(`${file}: mock stdout unchanged`, () => {
      expect(mockStdout(file)).toBe(expected);
    });
  }
});
```

- [ ] **Step 2:** Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx vitest run tests/d2-mock-parity.test.ts`
Expected: 6 passed (one per reworked lesson, each mock stdout byte-identical). If any fails, the named lesson's mock path drifted — fix that lesson's snippet (mock branch must be the original expression verbatim); do not edit the test/expected strings.

- [ ] **Step 3:** Full suite + typecheck: `npx vitest run && npx astro check` → all green; 0/0/0.

- [ ] **Step 4: Commit**
```bash
git add tests/d2-mock-parity.test.ts
git commit -m "test(d): deterministic mock-parity guard for the 6 reworked lessons"
```

---

### Task 9: e2e — representative networked all-mock test; full gates

**Files:** Modify `e2e/site.spec.ts`

- [ ] **Step 1:** Read `e2e/site.spec.ts`. Do NOT modify any existing test (the `02-the-agent-loop` PolicyRunner anchor `interactive lesson runs Python in-browser`, the quiz tests, model-settings, etc. all stay byte-unchanged). Append this test INSIDE the existing `test.describe("curriculum", () => { ... })` block, after the last test in it, before that describe's closing `});`:
```ts
  test("reworked interactive lesson runs Python in-browser (mock default)", async ({
    page,
  }) => {
    await page.goto("/learn/03-the-mock-llm");
    await page.getByRole("button", { name: /Run|Loading|Running/i }).click();
    const out = page.locator("pre[aria-live='polite']");
    await expect(out).toContainText(
      "prompt='weather in nyc?' -> 'tool:get_weather'",
      { timeout: 90_000 },
    );
    await expect(out).toContainText("prompt='say hi' -> 'answer:hello'");
    await expect(out).toContainText(
      "prompt='unknown request' -> 'answer:i_dont_know'",
    );
  });
```
(This proves PolicyRunner runs a *reworked non-02* lesson in-browser with the default mock — no key, no real call. Mock mode is the default in `ModelSettings`, so clicking Run exercises the `alb_real_mode = False` path.)

- [ ] **Step 2: Full non-networked gates:** `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npm test && npx astro check && npm run build`
Expected: `npm test` all green incl. `d2-mock-parity` 6 cases (total prior + 6); `astro check` 0/0/0; `npm run build` green, 51 pages.

- [ ] **Step 3: Authoritative networked e2e (MANDATORY):** run with the Bash tool's `dangerouslyDisableSandbox: true`:
`CI=1 npx playwright test --reporter=list`
Expected: ALL pass — the prior suite (incl. the unchanged `02-the-agent-loop` anchor + quiz Tool-Use + model-settings) plus the new `03-the-mock-llm` mock-default test. If ONLY a Pyodide test fails on a CDN/network/timeout to `cdn.jsdelivr.net`, retry once; if still only that and environmental → DONE_WITH_CONCERNS with the exact output, confirming every non-Pyodide test passed and the new lesson-03 test's status. Any assertion/locator failure → BLOCKED (fix the lesson/snippet, never weaken the test).

- [ ] **Step 4: Commit**
```bash
git add e2e/site.spec.ts
git commit -m "test(e2e): representative all-mock run on a reworked lesson (03-the-mock-llm)"
```

---

## Self-Review

**Spec coverage:**
- Selective 6 lessons (03,07,11,27,47,23), excluded 6 keep PyRunner → Tasks 2–7 modify exactly those 6; no task touches the excluded lessons ✓
- Additive PolicyRunner globals, existing `policy`/`mockAgentLoopPolicy`/lesson-02 untouched → Task 1 (additive insert after the `policy` set; Step 4 e2e proves lesson-02 anchor unaffected) ✓
- Mock branch = original expression verbatim, byte-identical by construction → every lesson task Step 2 keeps the mock call verbatim; Step 4 + Task 8 assert byte-identical stdout against the captured baselines ✓
- Real mode = `alb_call_model(INSTR + observation)`; lesson parser/fallback intact → each reworked snippet branches on `alb_real_mode`, real path prepends `INSTR`, mock/parser/loop unchanged; 27 `parse_role`→`"text"` default, 23 `parse_plan`→`[]` default preserve the lessons' own fallbacks ✓
- Prose note mirroring lesson 02 → "Conventions" exact sentence + each task Step 3 ✓
- Verification: deterministic per-lesson mock-parity (Task 2–7 Step 4 inline + Task 8 consolidated Vitest), lesson-02 anchor unchanged (Task 1 Step 4, Task 9 keeps it), one representative networked all-mock e2e on 03 (Task 9), no real call in CI (mock default; `alb_call_model` stub raises in parity harness) ✓
- Type/build/unit gates each task; frontmatter/slug unchanged (only import/tag/snippet/prose edited) → curriculum integrity/prev-next/redirect intact ✓
- Out of scope respected: no sync bridge/COOP-COEP, no streaming/tools API, no engine change beyond the 2 additive globals, PyRunner untouched, no A/CI/404 ✓

**Placeholder scan:** No TBD/TODO. Every reworked snippet is given in full verbatim; every expected mock stdout is the concrete captured baseline; the parity harness and the Vitest guard are complete code; INSTR strings are concrete per lesson; commands exact with expected output.

**Type/consistency:** `alb_real_mode` (boolean) and `alb_call_model` (async `(prompt)->Promise<string>`) are defined once in Task 1 and used identically in Tasks 2–7. `INSTR` is a per-snippet Python constant (string) in each. `parse_role`/`parse_plan` are defined in the snippet that uses them (Tasks 5/7). The mock-parity normalization (halve leading indent) and async-wrap harness are identical in the inline checks (Tasks 2–7 Step 4) and the Vitest guard (Task 8). The e2e locators (`getByRole("button",{name:/Run|Loading|Running/i})`, `pre[aria-live='polite']`) match PolicyRunner's DOM (same as the existing lesson-02 anchor). Lesson 03's snippet-local `policy = MockLLM(...)` intentionally shadows the injected `policy` global in mock mode (documented in spec); reworked lessons rely only on `alb_real_mode`/`alb_call_model`, never the injected `policy`.

No gaps.
