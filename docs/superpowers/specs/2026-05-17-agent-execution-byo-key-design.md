# Subsystem D — Agent Execution Layer, Cycle 1 — Design Spec

**Date:** 2026-05-17
**Status:** Approved
**Program context:** Subsystem D of the agentic-AI curriculum product.
Depends on B (curriculum framework, merged) and E (49-lesson curriculum,
merged). D is batched: **Cycle 1** proves a BYO-key real-LLM execution
path end-to-end on one flagship interactive lesson. Broadening to the
other 12 interactive lessons, and the synchronous byte-identical bridge,
are explicitly later cycles.

## Goal

Deliver a working, reviewed **bring-your-own-key real LLM execution**
path on the flagship lesson `02-the-agent-loop`, realizing the
curriculum's promise that real models swap in *behind the policy seam*.
Default behaviour is unchanged (deterministic mock); real execution is an
opt-in toggle using the learner's own key.

## Locked decisions

- **Surface:** a per-lesson toggle (`Mock | Real`) on the flagship
  interactive lesson only (Cycle 1). Mock is the default.
- **Provider model:** generic **OpenAI-compatible** Chat Completions
  (`POST {baseURL}/chat/completions`), with an editable, CORS-friendly
  **default base URL** + model, plus the learner's API key. The concrete
  default base-URL/model values are selected in the implementation plan;
  the spec only requires that a default is pre-filled and fully editable
  (it is not load-bearing — any OpenAI-compatible endpoint works).
- **Key handling:** **in-memory only** — a module-scoped JS value, never
  written to localStorage/sessionStorage, never logged, never placed in
  error messages; cleared on reload by design, plus an explicit
  "Forget key" control.
- **Seam mechanism (Approach C):** the policy becomes an *async*
  callable injected into Pyodide; the flagship lesson's Python is reworked
  to `await policy(obs)` (PyRunner already runs `runPythonAsync`). The
  **mock branch keeps byte-identical deterministic output** so the
  existing e2e PyRunner anchor on `02-the-agent-loop` stays green
  unchanged.
- Stays a static Astro site on Vercel — **no backend**. Real calls
  originate in the browser (`fetch`), subject to CORS and the learner's
  own key/cost.

## Architecture

- **`src/components/ModelSettings.tsx`** — React island. UI: mode toggle
  (`Mock | Real`), text inputs for base URL (pre-filled editable default)
  and model, a password input for the API key, a "Forget key" button, and
  a one-line notice: "Real mode uses your key and your spend; requests go
  directly from your browser to the provider you configure." Holds config
  in a module-scoped in-memory store (not React-persisted across reload,
  not in web storage). Exposes the current config to the lesson runtime.
- **`src/lib/realPolicy.ts`** — pure async `callRealModel(prompt, config)`:
  builds the OpenAI-compatible request (`Authorization: Bearer <key>`,
  `{ model, messages: [{ role: "user", content: prompt }] }`), performs
  `fetch`, parses `choices[0].message.content`, maps failures to a typed
  error. No key logging. `fetch` is injectable for tests.
- **`src/lib/mockPolicy.ts`** — the deterministic async mock for the
  flagship lesson: same mapping as today (`"search"` if `"unknown"` in the
  observation else `"answer"`), async signature, producing the **exact
  same printed lines** as the current lesson.
- **Lesson wiring** — the flagship lesson injects, into the Pyodide
  globals, an async `policy(obs)` that is the mock (default) or
  `callRealModel` (real mode, when a key is set). The lesson's Python
  loop uses `action = await policy(obs)`.
- **`src/content/lessons/02-the-agent-loop.mdx`** — reworked: the loop
  calls the injected `await policy(obs)` instead of an inline `decide`;
  prose updated to explain the seam and the optional real mode. Mock-mode
  output unchanged.

## Data flow

- **Mock (default):** toggle off / no key → injected `policy` = async
  mock → identical deterministic output → existing e2e passes, zero
  network, zero cost.
- **Real:** learner sets base URL / model / key in ModelSettings
  (in-memory) and toggles Real → `policy(prompt)` performs a browser
  `fetch` to the configured OpenAI-compatible endpoint → model text is
  returned and printed by the unchanged loop logic. The key exists only
  in memory and is sent only to the configured provider over HTTPS.

## Error handling

- No key, or lesson not real-capable → silently stays mock.
- CORS rejection / network error / 401 / non-2xx / malformed JSON /
  missing `choices` → caught and surfaced in the run output as a clear,
  actionable line: `real model call failed: <reason>; check base URL,
  key, model, and that the endpoint allows browser (CORS) requests`.
  Never crashes PyRunner; the toggle remains usable.
- The API key is never logged, never echoed into output or error text,
  never persisted; reload clears it (in-memory) and "Forget key" clears
  it immediately.
- UI states the cost/safety reality (own key, own spend, direct browser
  → provider).

## Testing

- **Unit (Vitest):** `callRealModel` — request shaping (URL, headers,
  body), response parsing (`choices[0].message.content`), and error
  mapping for non-2xx / network throw / malformed JSON, using an injected
  fake `fetch`; assert the key never appears in thrown error messages.
  `mockPolicy` determinism (same input → same documented output).
- **Type/build:** `npm run typecheck` (`astro check`) 0/0/0;
  `npm run build` green.
- **e2e (mandatory gate):** the existing 7 tests stay green — in
  particular the PyRunner anchor on `02-the-agent-loop` still asserts the
  exact **mock** output (toggle defaults to mock). Add e2e: ModelSettings
  island renders on the flagship lesson; the key field is `type=password`;
  a default (mock) run still prints the exact expected output; after
  entering a key and reloading, the key field is empty (in-memory only).
  **No real provider call is exercised in CI** (no key/network/provider);
  the real path's correctness is covered by `callRealModel` unit tests and
  a documented manual check.

## Out of scope (later D cycles / other subsystems)

- The other 12 interactive lessons' real-mode toggles (Approach B
  breadth).
- The synchronous `SharedArrayBuffer`/worker bridge that keeps lesson
  Python byte-identical (Approach A) and any cross-origin-isolation
  headers.
- Streaming responses; real tool/function-calling APIs; multi-message
  conversation state in the call; provider-specific features.
- Persistent key storage; key managers; multiple saved profiles.
- Subsystems A (accounts) and C (quiz engine); the GitHub Actions CI
  gate and custom 404 (separate optional infra).
