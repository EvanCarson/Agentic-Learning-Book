# Agentic Learning Book — Design Spec

**Date:** 2026-05-15
**Status:** Approved (initial scaffold)

## Purpose

An interactive web app that teaches agentic AI concepts through tutorials.
Content-heavy and static-first now; in-browser Python execution proven
end-to-end in the initial scaffold via Pyodide. No backend.

## Goals

- Static-hostable site (GitHub Pages / Netlify), zero per-user cost.
- Tutorials authored as MDX with typed frontmatter.
- Interactive Python runnable in the browser, no server, no accounts.
- Structure that scales to many lessons and a future server-side sandbox
  without rearchitecting.

## Non-Goals (YAGNI)

- User accounts / auth.
- Progress persistence.
- Server-side code sandbox or real LLM API calls.
- More than one real lesson (only a sample lesson in scaffold).

## Architecture

Astro static site. Pages prerender to static HTML. Interactivity is added
per-component as React islands (`@astrojs/react`), hydrated only where used
(`client:visible`), keeping content pages fast.

Tutorials are an Astro Content Collection: MDX files validated against a
typed schema at build time.

### Components / Structure

```
src/
  layouts/
    BaseLayout.astro       HTML shell, Tailwind, header
    TutorialLayout.astro   sidebar + content + prev/next nav
  components/
    Header.astro
    Sidebar.astro          auto-generated lesson list (by frontmatter order)
    PyRunner.tsx            React island: Pyodide code runner
  content/
    config.ts              content collection schema
    tutorials/
      01-what-is-an-agent.mdx   sample lesson, embeds <PyRunner>
  pages/
    index.astro            landing page
    tutorials/[...slug].astro   tutorial route
astro.config.mjs
package.json
```

### Data Flow

MDX frontmatter (`title`, `order`, `summary`) → Content Collection schema
→ drives sidebar ordering, routing, and prev/next navigation.

Pyodide: the `PyRunner` island lazily loads the Pyodide WASM runtime from
CDN on first interaction, executes user-edited Python in-browser, and
streams captured stdout/stderr back to an output panel. No data leaves
the browser.

Sample lesson Python is pure-Python (a mock agent loop) so it runs fully
client-side with no external API.

## Error Handling

- **Build-time:** Content schema validation fails the build on malformed
  frontmatter — authoring mistakes caught early.
- **PyRunner runtime states:**
  - Pyodide loading (spinner / disabled Run).
  - Python exception → traceback rendered in output panel; page does not crash.
  - CDN / runtime load failure → error message with retry.

## Testing

- `astro build` must succeed (schema + type validation gate).
- Sample tutorial renders and the `PyRunner` island mounts.
- Manual verification that the sample Python executes in-browser and output
  appears.

## Future Extensions (designed for, not built now)

- Additional MDX lessons drop into `content/tutorials/` and auto-appear.
- Server-side sandbox can be added behind the same `PyRunner` interface
  (swap execution backend) if real LLM API calls are later required.
- Progress/accounts can layer on without touching content structure.
