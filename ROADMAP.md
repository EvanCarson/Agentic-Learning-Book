# Roadmap — Remaining Work (User-Gated)

> **Audience:** future maintainers (human or agent) picking the project
> back up. The work below is **not blocked on engineering** — it is
> blocked on inputs only the project owner can provide (a Supabase
> project, a reversal of a deliberate "no workflow" decision, or a real
> API key). Each item lists exactly what is needed, the exact next
> steps, and the Definition of Done so it can be picked up later without
> reconstructing the context.
>
> **Shipped state as of 2026-05-19** (see commit log on `main`):
> curriculum framework + 49 lessons, Subsystem C Cycles 1+2 (quiz engine
> + all 12 module-check quizzes playable), Subsystem D Cycles 1+2
> (BYO-key real-model execution wired into 7 interactive lessons), UI
> redesign + self-hosted-font perf pass, custom branded 404. All local
> Definition-of-Done gates green; site auto-deploys static to Vercel.

---

## 1. Subsystem A — Accounts + Supabase-synced progress

**Status:** Not started. **Blocked on:** the project owner provisioning a
Supabase project + sharing the URL and anon key.

**Why deferred:** the engineering seam already exists (`ProgressStore`
interface in `src/lib/progress/`, with `LocalStorageProgressStore` as
the current implementation; the React hook `useProgress` and the
`MarkComplete` / `Quiz` islands consume the interface, not the concrete
class). Swapping in a `SupabaseProgressStore` is a contained change —
but it needs a live Supabase project and secrets the agent cannot
self-provision. Shipping a `SupabaseProgressStore` without a real
project to validate against would be dead code.

**What the owner provides**

1. A Supabase project (free tier is sufficient).
2. The `SUPABASE_URL` and `SUPABASE_ANON_KEY` values (the anon key is
   safe to ship to the client; row-level security gates the data).
3. Decision on auth provider — email magic-link is the lowest-friction
   default; GitHub OAuth is the obvious alternative for the audience.
4. Decision on whether anonymous-progress (current localStorage state)
   should migrate on first sign-in, or stay client-only until then.

**What gets built (exact next steps for the implementer)**

1. **Brainstorm + spec** (`docs/superpowers/specs/<date>-subsystem-a-accounts-design.md`)
   — auth provider choice, schema (`progress(user_id, lesson_slug,
   completed_at)` minimum), RLS policies (a user can only read/write
   their own row), the localStorage→cloud migration path on first
   sign-in, sign-out semantics, offline behavior.
2. **`SupabaseProgressStore` implementation** behind the existing
   `ProgressStore` interface in `src/lib/progress/`. No changes to
   `useProgress`, `MarkComplete`, or `Quiz` should be required if the
   interface holds — that is the whole point of the seam.
3. **A thin auth island** (sign-in / sign-out / "signed in as X"
   indicator) wired into `Header.astro`. Astro stays static; the auth
   state lives in the island.
4. **Tests:** unit-test the store against a mocked Supabase client
   (mirror the shape of `tests/progress-store.test.ts` from C1); an
   end-to-end Playwright pass that signs in, marks a lesson complete,
   reloads, and verifies the completion persisted server-side (gated by
   real Supabase secrets in CI / a dedicated test project).

**Definition of Done**

- `npm test` green incl. the new store tests.
- `npx astro check` 0/0/0, `npm run build` green.
- `CI=1 npx playwright test` green — the new auth + persistence e2e
  passes against the real Supabase test project; the existing 12 e2e
  unchanged.
- Anonymous (signed-out) users still get the localStorage path; sign-in
  triggers the documented migration; sign-out does not delete cloud
  data.

**Spec-board context**

- `src/lib/progress/` is the only seam to touch for the store swap.
- `Header.astro` is the only chrome touch-point.
- `vercel.json` should not need changes (static + client-side Supabase
  calls); confirm during brainstorm.
- This is explicitly out of scope of every prior cycle (see
  `docs/superpowers/specs/2026-05-17-agent-execution-byo-key-design.md`,
  `…2026-05-18-quiz-content-c2-design.md`, etc.).

---

## 2. CI workflow gate (GitHub Actions)

**Status:** Deliberately not added. **Blocked on:** the project owner
reversing the prior "no workflow now" decision.

**Why deferred:** during the BYO-key (Subsystem D Cycle 1) cycle the
owner explicitly chose "No workflow now". The Definition-of-Done gates
(`npm test`, `npm run typecheck`, `npm run build`, `npm run e2e`)
therefore remain **local-only** — Vercel's deploy pipeline runs only
`npm run build`, so a buildable-but-broken change can otherwise ship to
production. CLAUDE.md and README both call this out as a known caveat.

**What the owner decides**

1. Reverse the call — say "add the CI workflow" and the implementer
   adds it.
2. Whether the workflow should be **required** (block merges to `main`)
   or **informational** (run but don't block) on first introduction.
3. Whether the Pyodide-dependent e2e should run in CI (it needs
   `cdn.jsdelivr.net`; GitHub-hosted runners can reach it, but the
   ~30 s Pyodide cold-load and the lessons-that-call-real-models
   should be excluded or stubbed in CI).

**What gets built (exact next steps for the implementer)**

1. `.github/workflows/ci.yml` — Node 20, `npm ci`, then in order
   `npm test`, `npx astro check`, `npm run build`, `npx playwright
   install --with-deps chromium`, `CI=1 npx playwright test
   --reporter=list`. Cache `~/.npm` and the Playwright browser cache.
2. The real-mode lessons run with **no API key** in CI by default — the
   mock path is unchanged and is the one CI must guarantee, so the same
   12 e2e that pass locally pass headlessly in CI.
3. Branch protection on `main`: require the workflow to be green before
   merge (if the owner chose "required" above).
4. README + CLAUDE.md: remove or downgrade the "CI caveat" once the
   workflow exists and is required.

**Definition of Done**

- A PR opened to `main` shows the workflow running and going green.
- A deliberately-broken PR (e.g. delete one line of a passing test)
  shows the workflow going red and — if branch protection is on —
  blocking merge.
- CLAUDE.md and README updated to reflect the new reality.

**Spec-board context**

- The "no workflow" decision is captured in `CLAUDE.md` (the
  "Deployment" section) and `README.md` (the "CI caveat" callout) —
  those are the lines to revisit.
- Pyodide CDN reachability from GitHub runners has been confirmed
  during this project (the e2e suite has been run cleanly many times in
  ephemeral environments hitting `cdn.jsdelivr.net`); no special
  proxy/mirror is needed.

---

## 3. Manual real-mode (BYO-key) smoke check

**Status:** Code shipped, automated coverage by construction (mock
byte-identicality), **never manually validated end-to-end against a
live model**. **Blocked on:** the project owner running it with a real
API key.

**Why deferred:** Subsystem D Cycles 1+2 shipped a real-model execution
path on 7 interactive lessons (`03-the-mock-llm`,
`07-structured-output`, `11-a-tool-using-loop`,
`23-a-plan-execute-loop`, `27-supervisor-and-workers`,
`47-a-production-handler`, plus the canonical `02-the-agent-loop`).
The path is wired via the `alb_real_mode` / `alb_call_model` globals
that `PolicyRunner.tsx` injects into Pyodide; the mock path is
byte-identical to before, guarded by `tests/d2-mock-parity.test.ts`,
so the mock side is provably unbroken. **The real-mode side has only
been reasoned about — not driven against a live model from a real
browser.** The agent has no API key and cannot self-perform this
check.

**What the owner does (≤2 minutes)**

1. `git checkout main && npm ci && npm run build && npm run preview`.
2. Open `http://localhost:4321/learn/02-the-agent-loop`.
3. Open the **Model settings** panel (top of the lesson). Switch the
   toggle from **Mock** to **Real**, paste a real API key (Anthropic
   or OpenAI per the model dropdown), confirm the key is held in
   memory only.
4. Press **Run** on the embedded `PolicyRunner`. Expect: a real model
   call produces real output text rather than the deterministic mock
   string. The lesson's own parser/fallback handles imperfect output
   gracefully (verified per lesson in the D2 cycle).
5. Reload the page → confirm the key field is empty (the in-memory
   key clears on reload; this is intentional — there is no
   persistence).
6. (Optional) Repeat on one of the other six reworked lessons to
   confirm the same wiring works across the curriculum.

**Definition of Done**

- A live model call returns real text in the in-browser output panel
  on at least `/learn/02-the-agent-loop`.
- The key clears on reload (no localStorage / no cookie / no network
  leakage beyond the model-vendor call itself).
- Any defect found is filed as an issue with the exact lesson slug,
  the model + provider used, and the captured failure.

**Spec-board context**

- Real-mode design: `docs/superpowers/specs/2026-05-17-agent-execution-byo-key-design.md`
  (Cycle 1).
- Real-mode broadening: `docs/superpowers/specs/2026-05-18-agent-execution-d2-design.md`
  (Cycle 2 — note the execution amendment recorded in the spec).
- Implementation lives in `src/components/PolicyRunner.tsx`,
  `src/lib/realPolicy.ts`, `src/components/ModelSettings.tsx`,
  `src/lib/modelConfig.ts`. The mock-parity guard is
  `tests/d2-mock-parity.test.ts` — keep it green.

---

## Items explicitly **not** on this roadmap

These were considered during prior cycles and ruled out — listed here
so they are not re-proposed as "left to do":

- **500 / other error pages.** The custom 404 spec
  (`docs/superpowers/specs/2026-05-19-custom-404-design.md`) explicitly
  scopes only 404 — Astro static + Vercel's free-tier static preset
  does not emit a custom 500 route, so this would require SSR/adapter
  work that has been ruled out repeatedly.
- **Per-question immediate feedback / question shuffling / multi-select
  questions / attempt persistence** in quizzes. The Cycle-2 quiz-content
  spec explicitly scopes only the 5-question single-answer format
  matching the shipped engine.
- **Real-mode on every interactive lesson.** Cycle 2 (D2) deliberately
  picked the 7 lessons where the lesson narrative gains from a real
  model; the remaining interactive lessons stay mock-only by design
  (see the D2 spec).
- **A dynamic 404 / SSR.** See above — the project is fully static and
  that constraint is load-bearing for cost and simplicity.

---

## How to pick this up later

1. Read `CLAUDE.md` first (project + Definition of Done + architecture
   + conventions). It is the canonical engineering brief.
2. Read this `ROADMAP.md` to see which user-gated item to tackle next.
3. For each item above, the **What gets built (exact next steps)**
   list is the brainstorm input — feed it into
   `superpowers:brainstorming` to produce a fresh design spec under
   `docs/superpowers/specs/<date>-<topic>-design.md`, then
   `superpowers:writing-plans`, then
   `superpowers:subagent-driven-development` (the same loop every prior
   cycle used; the spec board shows the shape).
4. Honor the mandatory **UI testing** gate (`npm run e2e`) before
   claiming completion — this is non-negotiable for any change that
   touches source code (`src/**`, `e2e/**`, content, config). Pure
   Markdown / `docs/**` changes are exempt by rationale (they are not
   bundled into the site).
