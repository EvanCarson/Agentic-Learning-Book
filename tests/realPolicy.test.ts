import { describe, it, expect } from "vitest";
import { callRealModel, type FetchLike } from "../src/lib/realPolicy";
import type { ModelConfig } from "../src/lib/modelConfig";

const cfg: ModelConfig = {
  mode: "real",
  baseUrl: "https://example.test/v1/",
  model: "m1",
  apiKey: "sk-secret",
};

function res(status: number, body: unknown, jsonThrows = false) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (jsonThrows) throw new Error("bad json");
      return body;
    },
  };
}

describe("callRealModel", () => {
  it("shapes an OpenAI-compatible request and parses content", async () => {
    let seenUrl = "";
    let seenInit: any = null;
    const fake: FetchLike = async (url, init) => {
      seenUrl = url;
      seenInit = init;
      return res(200, { choices: [{ message: { content: "hello world" } }] });
    };
    const out = await callRealModel("ping", cfg, fake);
    expect(out).toBe("hello world");
    expect(seenUrl).toBe("https://example.test/v1/chat/completions");
    expect(seenInit.method).toBe("POST");
    expect(seenInit.headers.Authorization).toBe("Bearer sk-secret");
    expect(seenInit.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(seenInit.body)).toEqual({
      model: "m1",
      messages: [{ role: "user", content: "ping" }],
    });
  });

  it("maps a non-2xx response to an actionable error without the key", async () => {
    const fake: FetchLike = async () => res(401, { error: "nope" });
    await expect(callRealModel("p", cfg, fake)).rejects.toThrow(/HTTP 401/);
    await expect(callRealModel("p", cfg, fake)).rejects.not.toThrow(/sk-secret/);
  });

  it("maps a network throw to a CORS/network error without the key", async () => {
    const fake: FetchLike = async () => {
      throw new Error("Failed to fetch sk-secret");
    };
    try {
      await callRealModel("p", cfg, fake);
      throw new Error("should have thrown");
    } catch (e) {
      const m = String((e as Error).message);
      expect(m).toMatch(/network\/CORS/);
      expect(m).not.toContain("sk-secret");
    }
  });

  it("maps malformed JSON and missing content", async () => {
    await expect(
      callRealModel("p", cfg, async () => res(200, null, true)),
    ).rejects.toThrow(/not valid JSON/);
    await expect(
      callRealModel("p", cfg, async () => res(200, { choices: [] })),
    ).rejects.toThrow(/no choices\[0\]\.message\.content/);
  });
});
