import { describe, it, expect, beforeEach } from "vitest";
import {
  getModelConfig,
  setModelConfig,
  forgetKey,
  subscribeModelConfig,
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

  it("notifies subscribers and stops after unsubscribe", () => {
    let n = 0;
    const unsub = subscribeModelConfig(() => { n += 1; });
    setModelConfig({ mode: "real" });
    expect(n).toBe(1);
    unsub();
    setModelConfig({ apiKey: "sk-y" });
    expect(n).toBe(1);
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
