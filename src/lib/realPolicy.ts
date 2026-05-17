import type { ModelConfig } from "./modelConfig";

export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const HINT =
  "; check base URL, key, model, and that the endpoint allows browser (CORS) requests";

export async function callRealModel(
  prompt: string,
  config: ModelConfig,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  let res: { ok: boolean; status: number; json: () => Promise<unknown> };
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new Error(`real model call failed: network/CORS error${HINT}`);
  }
  if (!res.ok) {
    throw new Error(`real model call failed: HTTP ${res.status}${HINT}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("real model call failed: response was not valid JSON");
  }
  const content = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      "real model call failed: response had no choices[0].message.content",
    );
  }
  return content;
}
