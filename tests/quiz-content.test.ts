import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { quizQuestionSchema } from "../src/lib/quiz/schema";

const LESSONS_DIR = fileURLToPath(
  new URL("../src/content/lessons", import.meta.url),
);

function frontmatter(path: string): Record<string, unknown> {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${path}`);
  return (parse(m[1]) ?? {}) as Record<string, unknown>;
}

const quizFiles = readdirSync(LESSONS_DIR)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => `${LESSONS_DIR}/${f}`)
  .filter((p) => frontmatter(p).type === "quiz")
  .sort();

describe("quiz content", () => {
  it("there are exactly 12 quiz lessons", () => {
    expect(quizFiles.length).toBe(12);
  });

  for (const path of quizFiles) {
    const name = path.split("/").pop() as string;
    it(`${name}: >=5 schema-valid questions, answerIndex in range`, () => {
      const questions = frontmatter(path).questions;
      expect(Array.isArray(questions), `${name}: no questions array`).toBe(
        true,
      );
      const qs = questions as unknown[];
      expect(qs.length, `${name}: <5 questions`).toBeGreaterThanOrEqual(5);
      qs.forEach((q, i) => {
        const r = quizQuestionSchema.safeParse(q);
        expect(
          r.success,
          `${name} q${i} failed schema: ${JSON.stringify(q)}`,
        ).toBe(true);
      });
    });
  }
});
