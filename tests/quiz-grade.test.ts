import { describe, it, expect } from "vitest";
import { gradeQuiz, PASS_RATIO, type QuizQuestion } from "../src/lib/quiz/grade";

const q = (answerIndex: number): QuizQuestion => ({
  prompt: "p",
  options: ["a", "b", "c", "d"],
  answerIndex,
  explanation: "because",
});

describe("gradeQuiz", () => {
  it("PASS_RATIO is 0.7", () => {
    expect(PASS_RATIO).toBe(0.7);
  });

  it("all correct → passed, ratio 1, perQuestion all true", () => {
    const qs = [q(0), q(1), q(2)];
    const r = gradeQuiz(qs, [0, 1, 2]);
    expect(r).toEqual({
      correct: 3,
      total: 3,
      ratio: 1,
      passed: true,
      perQuestion: [{ correct: true }, { correct: true }, { correct: true }],
    });
  });

  it("all wrong → not passed, ratio 0", () => {
    const qs = [q(0), q(1)];
    const r = gradeQuiz(qs, [1, 0]);
    expect(r.correct).toBe(0);
    expect(r.ratio).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("exactly 70% → passed (boundary, inclusive)", () => {
    const qs = Array.from({ length: 10 }, () => q(0));
    const answers = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]; // 7/10
    const r = gradeQuiz(qs, answers);
    expect(r.correct).toBe(7);
    expect(r.ratio).toBeCloseTo(0.7, 10);
    expect(r.passed).toBe(true);
  });

  it("just below 70% → not passed", () => {
    const qs = Array.from({ length: 10 }, () => q(0));
    const answers = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]; // 6/10
    const r = gradeQuiz(qs, answers);
    expect(r.correct).toBe(6);
    expect(r.passed).toBe(false);
  });

  it("unanswered (null) counts as wrong", () => {
    const qs = [q(0), q(1)];
    const r = gradeQuiz(qs, [0, null]);
    expect(r.correct).toBe(1);
    expect(r.perQuestion).toEqual([{ correct: true }, { correct: false }]);
  });

  it("empty quiz → total 0, ratio 0, never passed", () => {
    const r = gradeQuiz([], []);
    expect(r).toEqual({
      correct: 0,
      total: 0,
      ratio: 0,
      passed: false,
      perQuestion: [],
    });
  });
});
