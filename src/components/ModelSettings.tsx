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
