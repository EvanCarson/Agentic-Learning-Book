import type { CollectionEntry } from "astro:content";
import type { LessonMeta } from "./curriculum";

export function toLessonMeta(entry: CollectionEntry<"lessons">): LessonMeta {
  return {
    slug: entry.id,
    moduleId: entry.data.moduleId,
    order: entry.data.order,
    type: entry.data.type,
    title: entry.data.title,
    summary: entry.data.summary,
    estMinutes: entry.data.estMinutes,
    questions: entry.data.questions,
  };
}
