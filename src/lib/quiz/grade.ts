export const PASS_RATIO = 0.7;

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  ratio: number;
  passed: boolean;
  perQuestion: { correct: boolean }[];
}

export function gradeQuiz(
  questions: QuizQuestion[],
  answers: (number | null)[],
): QuizResult {
  const perQuestion = questions.map((question, i) => ({
    correct: answers[i] === question.answerIndex,
  }));
  const correct = perQuestion.filter((p) => p.correct).length;
  const total = questions.length;
  const ratio = total === 0 ? 0 : correct / total;
  const passed = total > 0 && ratio >= PASS_RATIO;
  return { correct, total, ratio, passed, perQuestion };
}
