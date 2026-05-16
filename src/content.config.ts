import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const tutorials = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().nonnegative(),
    // Reserved for a future <meta name="description"> / listing blurb.
    // Required so every tutorial ships a one-line summary up front.
    summary: z.string(),
  }),
});

export const collections = { tutorials };
