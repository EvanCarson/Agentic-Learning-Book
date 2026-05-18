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
    <div className="card my-6 overflow-hidden not-prose">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <ModelSettings />
      </div>
      <textarea
        aria-label="Python source code"
        className="w-full resize-y border-0 bg-slate-900 p-4 font-mono text-sm text-slate-100 focus:outline-none"
        rows={Math.max(4, source.split("\n").length)}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
      />
      <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        <button
          onClick={run}
          disabled={busy}
          className="btn-primary"
        >
          {status === "loading"
            ? "Loading Python…"
            : status === "running"
              ? "Running…"
              : "Run"}
        </button>
        {status === "error" && (
          <span className="text-sm font-medium text-red-600 dark:text-red-400">Error — see output</span>
        )}
      </div>
      {output && (
        <pre aria-live="polite" className="overflow-x-auto border-t border-slate-200 bg-slate-950 p-4 font-mono text-sm text-emerald-300 dark:border-slate-800">
{output}
        </pre>
      )}
    </div>
  );
}
