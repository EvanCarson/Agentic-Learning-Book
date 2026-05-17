import { z } from "zod";

export const quizQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
    explanation: z.string().min(1),
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
