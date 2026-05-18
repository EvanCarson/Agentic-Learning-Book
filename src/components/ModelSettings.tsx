import { useEffect, useState } from "react";
import {
  getModelConfig,
  setModelConfig,
  forgetKey,
  subscribeModelConfig,
} from "../lib/modelConfig";

export default function ModelSettings() {
  const [, force] = useState(0);
  useEffect(() => subscribeModelConfig(() => force((n) => n + 1)), []);
  const cfg = getModelConfig();

  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 p-3 text-sm dark:border-slate-800">
      <fieldset>
        <legend className="font-semibold text-slate-800 dark:text-slate-200">Model</legend>
        <label className="mr-4 inline-flex items-center gap-1.5">
          <input
            type="radio"
            name="alb-model-mode"
            checked={cfg.mode === "mock"}
            onChange={() => setModelConfig({ mode: "mock" })}
          />{" "}
          Mock (default, free)
        </label>
        <label className="mr-4 inline-flex items-center gap-1.5">
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
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Base URL (OpenAI-compatible)
            </span>
            <input
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-slate-300 bg-white p-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              value={cfg.baseUrl}
              onChange={(e) => setModelConfig({ baseUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Model
            </span>
            <input
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-slate-300 bg-white p-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              value={cfg.model}
              onChange={(e) => setModelConfig({ model: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              API key
            </span>
            <input
              type="password"
              aria-label="API key"
              className="w-full rounded-[var(--radius-md)] border border-slate-300 bg-white p-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              value={cfg.apiKey}
              onChange={(e) => setModelConfig({ apiKey: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={() => forgetKey()}
            className="btn-secondary px-2 py-1 text-xs"
          >
            Forget key
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real mode uses your key and your spend; requests go directly from
            your browser to the provider you configure. The key is kept only in
            memory and is cleared when you reload.
          </p>
        </div>
      )}
    </div>
  );
}
