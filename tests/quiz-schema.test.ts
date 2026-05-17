import { describe, it, expect } from "vitest";
import { quizQuestionSchema } from "../src/lib/quiz/schema";

const valid = {
  prompt: "What is the agent loop?",
  options: ["a", "b", "c"],
  answerIndex: 1,
  explanation: "Because the loop repeats.",
};

describe("quizQuestionSchema", () => {
  it("accepts a well-formed question", () => {
    expect(quizQuestionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects fewer than 2 options", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, options: ["only"] });
    expect(r.success).toBe(false);
  });

  it("rejects an empty prompt", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, prompt: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a whitespace-only prompt", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, prompt: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects an empty explanation", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, explanation: "" });
    expect(r.success).toBe(false);
  });

  it("rejects an option that is an empty string", () => {
    const r = quizQuestionSchema.safeParse({
      ...valid,
      options: ["a", ""],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-integer answerIndex", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: 1.5 });
    expect(r.success).toBe(false);
  });

  it("rejects answerIndex out of range with an actionable message", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: 3 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.path.join(".") === "answerIndex"),
      ).toBe(true);
      expect(
        r.error.issues.some((i) => /out of range/.test(i.message)),
      ).toBe(true);
    }
  });

  it("rejects a negative answerIndex", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: -1 });
    expect(r.success).toBe(false);
  });

  it("accepts answerIndex at the last valid position", () => {
    const r = quizQuestionSchema.safeParse({ ...valid, answerIndex: 2 });
    expect(r.success).toBe(true);
  });
});
