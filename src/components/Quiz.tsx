import { useEffect, useRef, useState } from "react";
import { useProgress } from "../lib/progress/useProgress";
import { gradeQuiz, type QuizQuestion } from "../lib/quiz/grade";

export default function Quiz({
  slug,
  title,
  questions,
}: {
  slug: string;
  title: string;
  questions: QuizQuestion[];
}) {
  const { setComplete } = useProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  // Latches once on the first passing submission; deliberately never reset
  // by retry() so a later failed attempt cannot un-complete a lesson the
  // learner has already passed.
  const completedRef = useRef(false);

  const result = submitted ? gradeQuiz(questions, answers) : null;

  useEffect(() => {
    if (result?.passed && !completedRef.current) {
      completedRef.current = true;
      setComplete(slug, true);
    }
  }, [result, slug, setComplete]);

  if (questions.length === 0) {
    return (
      <div
        role="note"
        aria-label={`Quiz: ${title}`}
        className="my-6 rounded border border-dashed border-gray-400 p-6 text-center dark:border-gray-600"
      >
        <p className="text-lg font-semibold">Quiz: {title}</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Knowledge checks are coming soon. For now, review the lesson and
          mark it complete when you are confident.
        </p>
      </div>
    );
  }

  const allAnswered = answers.every((a) => a !== null);

  function choose(qi: number, oi: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
  }

  return (
    <div className="my-6 not-prose">
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const qResult = result?.perQuestion[qi];
          return (
            <li key={qi}>
              <fieldset>
                <legend className="font-semibold">{q.prompt}</legend>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`alb-q-${qi}`}
                        checked={answers[qi] === oi}
                        disabled={submitted}
                        onChange={() => choose(qi, oi)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {qResult && (
                  <p
                    className={
                      qResult.correct
                        ? "mt-2 text-sm text-green-700 dark:text-green-400"
                        : "mt-2 text-sm text-red-700 dark:text-red-400"
                    }
                  >
                    <span>
                      {qResult.correct ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                    {" — "}
                    {q.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {result ? (
        <div className="mt-6">
          <p role="status" aria-live="polite" className="font-semibold">
            You scored {result.correct} / {result.total} —{" "}
            {result.passed
              ? "passed. This lesson is marked complete."
              : "keep reviewing and try again."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded border border-gray-400 px-4 py-2 text-sm font-medium dark:border-gray-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      )}
    </div>
  );
}
