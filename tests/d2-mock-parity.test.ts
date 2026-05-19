import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const LESSONS = fileURLToPath(new URL("../src/content/lessons", import.meta.url));

// Captured pre-rework D2 mock-mode baseline. These strings are a deliberate
// regression pin: a failure means a reworked lesson's mock path drifted —
// fix the lesson, do NOT re-paste new output here without a reviewed re-baseline.
const EXPECTED: Record<string, string> = {
  "03-the-mock-llm.mdx":
    "prompt='weather in nyc?' -> 'tool:get_weather'\n" +
    "prompt='say hi' -> 'answer:hello'\n" +
    "prompt='unknown request' -> 'answer:i_dont_know'\n",
  "07-structured-output.mdx":
    "weather in nyc? => ('TOOL', 'get_weather')\n" +
    "say hi => ('ANSWER', 'hello')\n" +
    "garbled => ('ANSWER', 'unparseable')\n",
  "11-a-tool-using-loop.mdx":
    "weather in paris -> tool get_weather -> sunny in paris\n" +
    "two plus three -> tool add -> 5\n" +
    "hello -> answer -> hi\n",
  "27-supervisor-and-workers.mdx":
    "['math:2+2', 'text:summarise', 'text:unknown']\n",
  "47-a-production-handler.mdx":
    "{'status': 'ok', 'action': 'search: weather', 'trace': ['weather?', 'search: weather']}\n" +
    "{'status': 'ok', 'action': 'answer: ok', 'trace': ['hello', 'answer: ok']}\n" +
    "{'status': 'rejected', 'reason': 'no_budget'}\n",
  "23-a-plan-execute-loop.mdx":
    "plan for trip = ['weather', 'pack', 'book']\n" +
    "results = ['weather:done', 'pack:done', 'book:done']\n",
};

function mockStdout(file: string): string {
  const src = readFileSync(`${LESSONS}/${file}`, "utf8");
  const m = src.match(
    /<PolicyRunner client:visible code=\{`([\s\S]*?)`\}\s*\/>/,
  );
  if (!m) throw new Error(`${file}: no PolicyRunner snippet`);
  // MDX halves leading indentation (4->2, 8->6) before Pyodide runs it.
  const norm = m[1]
    .split("\n")
    .map((l) => {
      const i = l.length - l.replace(/^ +/, "").length;
      if (l.trim() !== "" && i % 2 !== 0) {
        throw new Error(
          `odd leading indent (${i}) in snippet line: ${JSON.stringify(l)} ` +
            "— MDX normalization expects even (4->2, 8->6) indentation",
        );
      }
      return " ".repeat(Math.floor(i / 2)) + l.slice(i);
    })
    .join("\n");
  // Mock mode: alb_real_mode False, alb_call_model must never be called.
  const indented = norm
    .split("\n")
    .map((l) => " " + l)
    .join("\n");
  const harness =
    "import asyncio\n" +
    "alb_real_mode=False\n" +
    "async def alb_call_model(p):\n" +
    " raise AssertionError('real model called in mock mode')\n" +
    "async def __m():\n" +
    indented +
    "\nasyncio.run(__m())\n";
  try {
    return execFileSync("python3", ["-c", harness], {
      encoding: "utf8",
      timeout: 10_000,
    });
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    throw new Error(`${file}: ${err.stderr || err.message}`);
  }
}

describe("D2 mock-parity (byte-identical mock output)", () => {
  beforeAll(() => {
    try {
      execFileSync("python3", ["--version"], { stdio: "ignore" });
    } catch {
      throw new Error(
        "d2-mock-parity requires `python3` on PATH (host CPython, used " +
          "only to deterministically replay each lesson's mock snippet; " +
          "distinct from Pyodide's WASM CPython at runtime).",
      );
    }
  });

  for (const [file, expected] of Object.entries(EXPECTED)) {
    it(`${file}: mock stdout unchanged`, () => {
      expect(mockStdout(file)).toBe(expected);
    });
  }
});
