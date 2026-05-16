import { useRef, useState } from "react";

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
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function PyRunner({ code }: { code: string }) {
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
      <textarea
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
        <pre className="overflow-x-auto border-t border-gray-300 bg-black p-3 text-sm text-green-400 dark:border-gray-700">
{output}
        </pre>
      )}
    </div>
  );
}
