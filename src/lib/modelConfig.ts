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
