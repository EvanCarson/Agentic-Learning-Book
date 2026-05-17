import { z } from "zod";
import type { QuizQuestion } from "./grade";

export const quizQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
    explanation: z.string().trim().min(1),
  })
  .superRefine((q, ctx) => {
    if (q.answerIndex >= q.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answerIndex"],
        message: `answerIndex ${q.answerIndex} is out of range for ${q.options.length} options`,
      });
    }
  });

// Compile-time guard: the validated schema output must stay structurally
// identical to the hand-written QuizQuestion contract in grade.ts (which
// must remain zod-free). If the two definitions drift, the type below
// resolves to `never` and this assignment fails `astro check`.
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
export const _quizQuestionConformance: Equals<
  z.infer<typeof quizQuestionSchema>,
  QuizQuestion
> = true;
