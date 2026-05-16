# Agentic Learning Book

An interactive web app teaching agentic AI. Tutorials are MDX; the Python
code runs entirely in your browser via Pyodide (no backend).

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
```

## Verify

```bash
npm test         # unit tests (navigation helper, Vitest)
npm run typecheck # astro check — authoritative type gate
npm run build    # static site -> dist/ (validates content schema)
```

Note: `npm run build` uses esbuild and does NOT type-check. Always run
`npm run typecheck` for type validation.

## Add a tutorial

Create `src/content/tutorials/NN-slug.mdx` with frontmatter
`title`, `order`, `summary`. It appears in the sidebar automatically,
ordered by `order`. Embed a runnable snippet with:

```mdx
import PyRunner from "../../components/PyRunner.tsx";

<PyRunner client:visible code={`print("hello")`} />
```

## Known limitations

- **PyRunner code indentation:** The MDX compiler normalizes the
  whitespace of the template-literal passed to `<PyRunner code={`...`}/>`,
  reducing 4-space Python indentation to 2-space in the rendered editor.
  The code still runs correctly, but learners editing it should match the
  existing 2-space indentation (adding PEP 8 4-space lines will raise
  `IndentationError`). A future improvement is to load snippet code from a
  separate raw-imported `.py` file to preserve exact whitespace.
- **In-browser Python run is a manual check:** automated build/typecheck
  cannot exercise the live Pyodide runtime (it loads in a real browser).
  See Manual verification below.

## Manual verification (Pyodide runtime)

```bash
npm run preview
```

Open `http://localhost:4321/tutorials/01-what-is-an-agent`, press **Run**.
After a Pyodide load delay the output panel should show:

```
obs='unknown topic' -> action='search'
obs='known fact' -> action='answer'
obs='unknown thing' -> action='search'
```

## Deploy

`dist/` is fully static — host on GitHub Pages, Netlify, or any static
host. No server required.
