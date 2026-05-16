import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    moduleId: z.string(),
    order: z.number().int().positive(),
    type: z.enum(["reading", "interactive", "quiz"]),
    summary: z.string(),
    estMinutes: z.number().int().positive(),
  }),
});

export const collections = { lessons };
