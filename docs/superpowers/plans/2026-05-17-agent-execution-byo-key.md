# Agent Execution Layer — Cycle 1 (Subsystem D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. Execute on a branch off `main`.

**Goal:** Add an opt-in BYO-key real-LLM execution path to the flagship lesson `02-the-agent-loop`, via an async `policy` seam, with an in-memory key and an editable OpenAI-compatible default — default behaviour (deterministic mock) and the existing e2e anchor stay unchanged.

**Architecture:** Stays static Astro/Vercel, no backend. New focused units: an in-memory config store, a pure OpenAI-compatible call helper, an async mock policy, a `ModelSettings` React island, and a new `PolicyRunner.tsx` (used only by the flagship lesson; `PyRunner.tsx` is left untouched so the other 12 interactive lessons and their e2e are unaffected). PolicyRunner injects an async `policy(obs)` JS function into Pyodide globals (mock by default; real `fetch` when mode=real and a key is set); the flagship lesson's Python loop calls `await policy(obs)`. PolicyRunner mirrors PyRunner's exact Run button + `pre[aria-live='polite']` DOM and the mock output is byte-identical, so the existing e2e PyRunner anchor on this lesson stays green.

**Tech Stack:** Astro 6 (B framework, unchanged), React 19 island, Pyodide (runPythonAsync, JS-function injection + Promise await — already in use), Vitest (pure-logic TDD), Playwright e2e.

Working directory: repo root, branch off `main`.

**Invariant:** every commit keeps `npx astro check` 0/0/0 and `npm run build` green. The flagship lesson's **mock** output must remain exactly:
```
obs='unknown topic' -> action='search'
obs='known fact' -> action='answer'
obs='unknown thing' -> action='search'
```
so the existing e2e anchor (`interactive lesson runs Python in-browser`) passes unchanged.

---

### Task 0: Branch

- [ ] **Step 1**
```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
git checkout main && git pull --ff-only origin main
git checkout -b agent-execution-d1
git branch --show-current
```
Expected: prints `agent-execution-d1`.

---

## File Structure

```
src/lib/modelConfig.ts            in-memory config store (mode/baseUrl/model/apiKey) + defaults + subscribe; no web storage
src/lib/realPolicy.ts             pure callRealModel(prompt, config, fetchImpl) — OpenAI-compatible request/parse/error map
src/lib/mockPolicy.ts             async deterministic mockAgentLoopPolicy(observation)
src/components/ModelSettings.tsx  React island UI bound to modelConfig (toggle, baseUrl/model, password key, forget, notice)
src/components/PolicyRunner.tsx   flagship-lesson runner: Pyodide + injects async policy (mock|real) + ModelSettings; PyRunner DOM mirrored
src/content/lessons/02-the-agent-loop.mdx  MODIFY: use PolicyRunner + `await policy(obs)` loop; mock output byte-identical
tests/modelConfig.test.ts         unit
tests/realPolicy.test.ts          unit
tests/mockPolicy.test.ts          unit
e2e/site.spec.ts                  MODIFY: keep 7; add ModelSettings/password/in-memory-key assertions
```
`src/components/PyRunner.tsx` is NOT modified (the other 12 interactive lessons keep using it untouched).

---

### Task 1: In-memory model config store (TDD)

**Files:** Create `tests/modelConfig.test.ts`, `src/lib/modelConfig.ts`.

- [ ] **Step 1: Failing test** — create `tests/modelConfig.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getModelConfig,
  setModelConfig,
  forgetKey,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
} from "../src/lib/modelConfig";

describe("modelConfig", () => {
  beforeEach(() => {
    setModelConfig({ mode: "mock", baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL, apiKey: "" });
  });

  it("defaults to mock mode with the default base url + model and no key", () => {
    const c = getModelConfig();
    expect(c.mode).toBe("mock");
    expect(c.baseUrl).toBe(DEFAULT_BASE_URL);
    expect(c.model).toBe(DEFAULT_MODEL);
    expect(c.apiKey).toBe("");
  });

  it("patches fields and returns a copy (not the internal object)", () => {
    setModelConfig({ mode: "real", apiKey: "sk-test" });
    const a = getModelConfig();
    a.apiKey = "mutated";
    expect(getModelConfig().apiKey).toBe("sk-test");
    expect(getModelConfig().mode).toBe("real");
  });

  it("forgetKey clears only the key", () => {
    setModelConfig({ mode: "real", apiKey: "sk-test" });
    forgetKey();
    const c = getModelConfig();
    expect(c.apiKey).toBe("");
    expect(c.mode).toBe("real");
  });

  it("does not touch web storage", () => {
    const calls: string[] = [];
    const fake = { setItem: () => calls.push("set"), getItem: () => { calls.push("get"); return null; }, removeItem: () => calls.push("rm") } as unknown as Storage;
    (globalThis as any).localStorage = fake;
    (globalThis as any).sessionStorage = fake;
    setModelConfig({ apiKey: "sk-x" });
    forgetKey();
    getModelConfig();
    expect(calls).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect fail**
Run: `cd /Users/cq/Git/agentic/Agentic-Learning-Book && npx vitest run tests/modelConfig.test.ts`
Expected: FAIL — cannot resolve `../src/lib/modelConfig`.

- [ ] **Step 3: Implement** — create `src/lib/modelConfig.ts`:
```ts
export type Mode = "mock" | "real";

export interface ModelConfig {
  mode: Mode;
  baseUrl: string;
  model: string;
  apiKey: string;
}

// Editable, not load-bearing: any OpenAI-compatible browser-CORS endpoint works.
export const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

let config: ModelConfig = {
  mode: "mock",
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
  apiKey: "",
};

const listeners = new Set<() => void>();

export function getModelConfig(): ModelConfig {
  return { ...config };
}

export function setModelConfig(patch: Partial<ModelConfig>): void {
  config = { ...config, ...patch };
  for (const l of listeners) l();
}

export function forgetKey(): void {
  setModelConfig({ apiKey: "" });
}

export function subscribeModelConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
```
(In-memory only: module-scoped `config`; a page reload re-evaluates the module and resets it, so the key never survives a reload. No `localStorage`/`sessionStorage` access anywhere.)

- [ ] **Step 4: Run, expect pass**
Run: `npx vitest run tests/modelConfig.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/modelConfig.ts tests/modelConfig.test.ts
git commit -m "feat(d): in-memory model config store"
```

---

### Task 2: OpenAI-compatible call helper (TDD)

**Files:** Create `tests/realPolicy.test.ts`, `src/lib/realPolicy.ts`.

- [ ] **Step 1: Failing test** — create `tests/realPolicy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { callRealModel, type FetchLike } from "../src/lib/realPolicy";
import type { ModelConfig } from "../src/lib/modelConfig";

const cfg: ModelConfig = {
  mode: "real",
  baseUrl: "https://example.test/v1/",
  model: "m1",
  apiKey: "sk-secret",
};

function res(status: number, body: unknown, jsonThrows = false) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (jsonThrows) throw new Error("bad json");
      return body;
    },
  };
}

describe("callRealModel", () => {
  it("shapes an OpenAI-compatible request and parses content", async () => {
    let seenUrl = "";
    let seenInit: any = null;
    const fake: FetchLike = async (url, init) => {
      seenUrl = url;
      seenInit = init;
      return res(200, { choices: [{ message: { content: "hello world" } }] });
    };
    const out = await callRealModel("ping", cfg, fake);
    expect(out).toBe("hello world");
    expect(seenUrl).toBe("https://example.test/v1/chat/completions");
    expect(seenInit.method).toBe("POST");
    expect(seenInit.headers.Authorization).toBe("Bearer sk-secret");
    expect(seenInit.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(seenInit.body)).toEqual({
      model: "m1",
      messages: [{ role: "user", content: "ping" }],
    });
  });

  it("maps a non-2xx response to an actionable error without the key", async () => {
    const fake: FetchLike = async () => res(401, { error: "nope" });
    await expect(callRealModel("p", cfg, fake)).rejects.toThrow(/HTTP 401/);
    await expect(callRealModel("p", cfg, fake)).rejects.not.toThrow(/sk-secret/);
  });

  it("maps a network throw to a CORS/network error without the key", async () => {
    const fake: FetchLike = async () => {
      throw new Error("Failed to fetch sk-secret");
    };
    try {
      await callRealModel("p", cfg, fake);
      throw new Error("should have thrown");
    } catch (e) {
      const m = String((e as Error).message);
      expect(m).toMatch(/network\/CORS/);
      expect(m).not.toContain("sk-secret");
    }
  });

  it("maps malformed JSON and missing content", async () => {
    await expect(
      callRealModel("p", cfg, async () => res(200, null, true)),
    ).rejects.toThrow(/not valid JSON/);
    await expect(
      callRealModel("p", cfg, async () => res(200, { choices: [] })),
    ).rejects.toThrow(/no choices\[0\]\.message\.content/);
  });
});
```

- [ ] **Step 2: Run, expect fail**
Run: `npx vitest run tests/realPolicy.test.ts`
Expected: FAIL — cannot resolve `../src/lib/realPolicy`.

- [ ] **Step 3: Implement** — create `src/lib/realPolicy.ts`:
```ts
import type { ModelConfig } from "./modelConfig";

export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const HINT =
  "; check base URL, key, model, and that the endpoint allows browser (CORS) requests";

export async function callRealModel(
  prompt: string,
  config: ModelConfig,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  let res: { ok: boolean; status: number; json: () => Promise<unknown> };
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new Error(`real model call failed: network/CORS error${HINT}`);
  }
  if (!res.ok) {
    throw new Error(`real model call failed: HTTP ${res.status}${HINT}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("real model call failed: response was not valid JSON");
  }
  const content = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      "real model call failed: response had no choices[0].message.content",
    );
  }
  return content;
}
```
(The caught error variables are never interpolated into messages, so the API key — which a provider/network error string could echo — never reaches output.)

- [ ] **Step 4: Run, expect pass**
Run: `npx vitest run tests/realPolicy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/realPolicy.ts tests/realPolicy.test.ts
git commit -m "feat(d): pure OpenAI-compatible callRealModel helper"
```

---

### Task 3: Async deterministic mock policy (TDD)

**Files:** Create `tests/mockPolicy.test.ts`, `src/lib/mockPolicy.ts`.

- [ ] **Step 1: Failing test** — create `tests/mockPolicy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mockAgentLoopPolicy } from "../src/lib/mockPolicy";

describe("mockAgentLoopPolicy", () => {
  it("returns 'search' when the observation contains 'unknown', else 'answer'", async () => {
    expect(await mockAgentLoopPolicy("unknown topic")).toBe("search");
    expect(await mockAgentLoopPolicy("known fact")).toBe("answer");
    expect(await mockAgentLoopPolicy("unknown thing")).toBe("search");
  });

  it("is deterministic across calls", async () => {
    expect(await mockAgentLoopPolicy("unknown topic")).toBe(
      await mockAgentLoopPolicy("unknown topic"),
    );
  });
});
```

- [ ] **Step 2: Run, expect fail**
Run: `npx vitest run tests/mockPolicy.test.ts`
Expected: FAIL — cannot resolve `../src/lib/mockPolicy`.

- [ ] **Step 3: Implement** — create `src/lib/mockPolicy.ts`:
```ts
// Deterministic async stand-in for a real model, matching the original
// `02-the-agent-loop` rule so the lesson's mock output is byte-identical.
export async function mockAgentLoopPolicy(
  observation: string,
): Promise<string> {
  return observation.includes("unknown") ? "search" : "answer";
}
```

- [ ] **Step 4: Run, expect pass**
Run: `npx vitest run tests/mockPolicy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/mockPolicy.ts tests/mockPolicy.test.ts
git commit -m "feat(d): async deterministic mock policy"
```

---

### Task 4: ModelSettings island

**Files:** Create `src/components/ModelSettings.tsx`.

- [ ] **Step 1: Create `src/components/ModelSettings.tsx`**
```tsx
import { useEffect, useState } from "react";
import {
  getModelConfig,
  setModelConfig,
  forgetKey,
  subscribeModelConfig,
  type Mode,
} from "../lib/modelConfig";

export default function ModelSettings() {
  const [, force] = useState(0);
  useEffect(() => subscribeModelConfig(() => force((n) => n + 1)), []);
  const cfg = getModelConfig();

  return (
    <div className="mb-3 rounded border border-gray-300 p-3 text-sm dark:border-gray-700">
      <fieldset>
        <legend className="font-semibold">Model</legend>
        <label className="mr-4">
          <input
            type="radio"
            name="alb-model-mode"
            checked={cfg.mode === "mock"}
            onChange={() => setModelConfig({ mode: "mock" })}
          />{" "}
          Mock (default, free)
        </label>
        <label>
          <input
            type="radio"
            name="alb-model-mode"
            checked={cfg.mode === "real"}
            onChange={() => setModelConfig({ mode: "real" })}
          />{" "}
          Real (your key)
        </label>
      </fieldset>

      {cfg.mode === "real" && (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="block text-xs text-gray-600 dark:text-gray-400">
              Base URL (OpenAI-compatible)
            </span>
            <input
              type="text"
              className="w-full rounded border border-gray-300 p-1 dark:border-gray-700 dark:bg-gray-900"
              value={cfg.baseUrl}
              onChange={(e) => setModelConfig({ baseUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 dark:text-gray-400">
              Model
            </span>
            <input
              type="text"
              className="w-full rounded border border-gray-300 p-1 dark:border-gray-700 dark:bg-gray-900"
              value={cfg.model}
              onChange={(e) => setModelConfig({ model: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 dark:text-gray-400">
              API key
            </span>
            <input
              type="password"
              aria-label="API key"
              className="w-full rounded border border-gray-300 p-1 dark:border-gray-700 dark:bg-gray-900"
              value={cfg.apiKey}
              onChange={(e) => setModelConfig({ apiKey: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={() => forgetKey()}
            className="rounded border border-gray-400 px-2 py-1 text-xs dark:border-gray-600"
          >
            Forget key
          </button>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Real mode uses your key and your spend; requests go directly from
            your browser to the provider you configure. The key is kept only in
            memory and is cleared when you reload.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
Run: `npx astro check`
Expected: 0 errors / 0 warnings / 0 hints. (Component not yet referenced — fine.)

- [ ] **Step 3: Commit**
```bash
git add src/components/ModelSettings.tsx
git commit -m "feat(d): ModelSettings island (in-memory key UI)"
```

---

### Task 5: PolicyRunner component

**Files:** Create `src/components/PolicyRunner.tsx`.

- [ ] **Step 1: Create `src/components/PolicyRunner.tsx`**
```tsx
import { useRef, useState } from "react";
import ModelSettings from "./ModelSettings";
import { getModelConfig } from "../lib/modelConfig";
import { callRealModel } from "../lib/realPolicy";
import { mockAgentLoopPolicy } from "../lib/mockPolicy";

const PYODIDE_VERSION = "0.27.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

type Status = "idle" | "loading" | "running" | "ready" | "error";

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(s);
  });
}

export default function PolicyRunner({ code }: { code: string }) {
  const [source, setSource] = useState(code);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const pyodideRef = useRef<any>(null);

  async function getPyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    setStatus("loading");
    await loadScript(`${PYODIDE_CDN}/pyodide.js`);
    if (!window.loadPyodide) throw new Error("Pyodide failed to initialize");
    pyodideRef.current = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    return pyodideRef.current;
  }

  async function run() {
    setOutput("");
    try {
      const pyodide = await getPyodide();
      setStatus("running");
      const cfg = getModelConfig();
      const policy = async (observation: string): Promise<string> =>
        cfg.mode === "real" && cfg.apiKey
          ? callRealModel(observation, cfg)
          : mockAgentLoopPolicy(observation);
      pyodide.globals.set("policy", policy);
      let captured = "";
      pyodide.setStdout({ batched: (s: string) => (captured += s + "\n") });
      pyodide.setStderr({ batched: (s: string) => (captured += s + "\n") });
      await pyodide.runPythonAsync(source);
      setOutput(captured || "(no output)");
      setStatus("ready");
    } catch (err) {
      setOutput(String(err));
      setStatus("error");
    }
  }

  const busy = status === "loading" || status === "running";

  return (
    <div className="my-6 rounded border border-gray-300 dark:border-gray-700">
      <div className="p-2">
        <ModelSettings />
      </div>
      <textarea
        aria-label="Python source code"
        className="w-full resize-y bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900"
        rows={Math.max(4, source.split("\n").length)}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
      />
      <div className="flex items-center gap-3 border-t border-gray-300 p-2 dark:border-gray-700">
        <button
          onClick={run}
          disabled={busy}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {status === "loading"
            ? "Loading Python…"
            : status === "running"
              ? "Running…"
              : "Run"}
        </button>
        {status === "error" && (
          <span className="text-sm text-red-600">Error — see output</span>
        )}
      </div>
      {output && (
        <pre aria-live="polite" className="overflow-x-auto border-t border-gray-300 bg-black p-3 text-sm text-green-400 dark:border-gray-700">
{output}
        </pre>
      )}
    </div>
  );
}
```
(Run button label states and the `pre[aria-live='polite']` output element exactly mirror `PyRunner.tsx`, so the existing e2e anchor's locators and assertions on this lesson keep working. `policy` is injected into Pyodide globals as an async JS function; the lesson's Python `await policy(obs)` resolves the returned Promise under `runPythonAsync`.)

- [ ] **Step 2: Typecheck**
Run: `npx astro check`
Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 3: Commit**
```bash
git add src/components/PolicyRunner.tsx
git commit -m "feat(d): PolicyRunner — Pyodide runner with injected mock|real policy"
```

---

### Task 6: Rework the flagship lesson to the async seam (mock output byte-identical)

**Files:** Modify `src/content/lessons/02-the-agent-loop.mdx`.

- [ ] **Step 1: Replace `src/content/lessons/02-the-agent-loop.mdx` ENTIRELY with:**

````mdx
---
title: "The Agent Loop"
moduleId: "foundations"
order: 2
type: "interactive"
summary: "Run the perceive–decide–act loop — mock by default, or a real model with your key."
estMinutes: 10
---

import PolicyRunner from "../../components/PolicyRunner.tsx";

**Objective:** run the perceive–decide–act loop where `policy` is the
swappable seam — the same loop, a deterministic mock by default or a real
model behind the toggle.

The loop is the whole game. `policy(observation) -> action` is provided by
the runtime: **Mock** (default, deterministic, free) or **Real** (your own
OpenAI-compatible key, called directly from your browser). The loop code
below never changes — only what is behind `policy` does. That is the
curriculum's thesis, made real.

<PolicyRunner client:visible code={`# policy(observation) -> action is injected by the runtime.
# Mock by default; switch to Real above to use your own model.
observations = ["unknown topic", "known fact", "unknown thing"]
for obs in observations:
    action = await policy(obs)
    print(f"obs={obs!r} -> action={action!r}")
`} />

In **Mock** mode the policy returns `search` when the observation contains
`"unknown"`, else `answer` — deterministic, so the output is always the
same. Flip to **Real** and the identical loop drives a live model with
your key; production is exactly this swap.

> **Best practice:** keep `policy(observation) -> action` as the only seam.
> Mock it for fast deterministic tests; swap a real model behind it for
> production — the loop never changes.

Next: **The Mock LLM**
````

- [ ] **Step 2: Build + verify mock output byte-identical**
```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
npx astro check
npm run build
test -f dist/learn/02-the-agent-loop/index.html && grep -q 'client="visible"' dist/learn/02-the-agent-loop/index.html && echo ISLAND_OK
```
Expected: astro check 0/0/0; build green; prints `ISLAND_OK`. (Lesson slug/order/type/title unchanged → curriculum integrity + the e2e prev/next + redirect tests stay valid. Mock-mode output is exactly the three asserted lines because `mockAgentLoopPolicy` applies the same `"unknown"` rule and the loop keeps the `f"obs={obs!r} -> action={action!r}"` format and the same observations list.)

- [ ] **Step 3: Commit**
```bash
git add src/content/lessons/02-the-agent-loop.mdx
git commit -m "feat(d): flagship lesson uses PolicyRunner + await policy seam (mock output unchanged)"
```

---

### Task 7: e2e — keep the 7, add D assertions; full gates

**Files:** Modify `e2e/site.spec.ts`.

- [ ] **Step 1: Open `e2e/site.spec.ts` and make exactly these additions/edits (do not weaken existing tests):**

(a) The existing test `"interactive lesson runs Python in-browser"` (goto `/learn/02-the-agent-loop`, click Run, assert the three `obs=... -> action=...` lines) stays **unchanged** — it now exercises PolicyRunner in default mock mode and must still pass verbatim.

(b) Append these two tests inside the existing `test.describe("curriculum", ...)` block:
```ts
  test("flagship lesson shows the model settings (mock default)", async ({ page }) => {
    await page.goto("/learn/02-the-agent-loop");
    await expect(
      page.getByRole("radio", { name: /Mock \(default/i }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Real \(your key/i }),
    ).toBeVisible();
  });

  test("API key field is a password input and is cleared on reload", async ({ page }) => {
    await page.goto("/learn/02-the-agent-loop");
    await page.getByRole("radio", { name: /Real \(your key/i }).check();
    const key = page.getByLabel("API key");
    await expect(key).toHaveAttribute("type", "password");
    await key.fill("sk-not-a-real-key");
    await expect(key).toHaveValue("sk-not-a-real-key");
    await page.reload();
    await page.getByRole("radio", { name: /Real \(your key/i }).check();
    await expect(page.getByLabel("API key")).toHaveValue("");
  });
```
(No test performs a real provider request: real-path correctness is covered by `tests/realPolicy.test.ts`. The default-mock run is covered by the unchanged anchor test.)

- [ ] **Step 2: Full gate set**
```bash
cd /Users/cq/Git/agentic/Agentic-Learning-Book
npm test
npx astro check
npm run build
```
Expected: `npm test` — all prior unit tests plus the 3 new D suites (modelConfig, realPolicy, mockPolicy) pass; `astro check` 0/0/0; `npm run build` green (still 51 lesson/pages; lesson 02 slug unchanged).

- [ ] **Step 3: Authoritative networked e2e**
Run: `CI=1 npx playwright test --reporter=list`
Expected: all tests pass — the 7 originals (including the unchanged PyRunner anchor now served by PolicyRunner in mock mode, producing the exact three lines) plus the 2 new D tests (model settings visible/mock-default; key is password + cleared on reload). Run where the Pyodide CDN is reachable.

- [ ] **Step 4: Commit**
```bash
git add e2e/site.spec.ts
git commit -m "test(e2e): D — model settings present, key password + in-memory, mock anchor unchanged"
```

---

## Self-Review

**Spec coverage:**
- Toggle on the flagship interactive lesson only → Task 4 (ModelSettings) + Task 5 (PolicyRunner) + Task 6 (lesson uses PolicyRunner); other 12 lessons keep PyRunner untouched ✓
- OpenAI-compatible, editable CORS-friendly default → Task 1 (`DEFAULT_BASE_URL`/`DEFAULT_MODEL`, editable in Task 4 UI) + Task 2 (request shaping) ✓
- In-memory key, never persisted/logged, forget + reload-clears → Task 1 (module-scoped, no web storage; test asserts it) + Task 4 (password input, Forget key, notice) + Task 7 reload test ✓
- Async-seam mechanism, mock byte-identical so e2e anchor green → Task 3 (same rule) + Task 5 (inject async policy) + Task 6 (same observations + print format) + Task 7 (anchor unchanged) ✓
- Error handling: missing key→mock (Task 5 ternary); CORS/HTTP/JSON/missing-content mapped, key never in message (Task 2 + its tests); never crashes runner (Task 5 try/catch shows message) ✓
- Testing: unit for the three libs (Tasks 1–3 TDD), astro check/build (Task 6/7), e2e keeps 7 + adds D, no real provider call in CI (Task 7) ✓
- Out of scope respected: only lesson 02 component-swapped; PyRunner untouched; no sync bridge / COOP-COEP; no streaming/tool-calling; no persistence; no A/C ✓

**Placeholder scan:** No TBD/TODO; every file's full content is given; the default base-URL/model are concrete (`openrouter.ai/api/v1` / `openai/gpt-4o-mini`), editable, and explicitly not load-bearing (unit tests pass config explicitly).

**Type/consistency:** `ModelConfig`/`Mode` defined in Task 1, imported by Tasks 2,4,5. `FetchLike` defined Task 2, used in its tests. `callRealModel(prompt, config, fetchImpl?)`, `mockAgentLoopPolicy(observation)`, `getModelConfig/setModelConfig/forgetKey/subscribeModelConfig/DEFAULT_BASE_URL/DEFAULT_MODEL` names are identical across tasks. PolicyRunner injects `policy`; lesson Python calls `await policy(obs)` — names match. Run-button label states + `pre[aria-live='polite']` mirror PyRunner so existing e2e locators (`getByRole("button",{name:/Run|Loading|Running/i})`, `pre[aria-live='polite']`) and the three-line assertion still resolve. Lesson frontmatter slug/order/type/title unchanged → curriculum + redirect + prev/next e2e unaffected.

No gaps.
