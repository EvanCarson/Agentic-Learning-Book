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
        className="card my-6 p-6 text-center"
      >
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quiz: {title}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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
      <ol className="space-y-5">
        {questions.map((q, qi) => {
          const qResult = result?.perQuestion[qi];
          return (
            <li key={qi} className="card p-5">
              <fieldset>
                <legend className="text-base font-semibold text-slate-900 dark:text-slate-100">{q.prompt}</legend>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
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
                        ? "mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
                        : "mt-2 text-sm font-medium text-red-700 dark:text-red-400"
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
        <div className="mt-6 card p-5">
          <p role="status" aria-live="polite" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            You scored {result.correct} / {result.total} —{" "}
            {result.passed
              ? "passed. This lesson is marked complete."
              : "keep reviewing and try again."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="btn-secondary mt-3"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="btn-primary mt-6"
        >
          Submit
        </button>
      )}
    </div>
  );
}
