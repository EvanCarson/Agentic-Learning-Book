import type { Module } from "../content/modules";
import type { QuizQuestion } from "./quiz/grade";

export type LessonType = "reading" | "interactive" | "quiz";

export interface LessonMeta {
  slug: string;
  moduleId: string;
  order: number;
  type: LessonType;
  title: string;
  summary: string;
  estMinutes: number;
  questions?: QuizQuestion[];
}

export interface ModuleWithLessons extends Module {
  lessons: LessonMeta[];
}

export interface Curriculum {
  modules: ModuleWithLessons[];
  sequence: LessonMeta[];
}

export function buildCurriculum(
  modules: Module[],
  lessons: LessonMeta[],
): Curriculum {
  const byId = new Map(modules.map((m) => [m.id, m]));

  const seenSlugs = new Set<string>();
  for (const l of lessons) {
    if (seenSlugs.has(l.slug)) {
      throw new Error(`Curriculum: duplicate lesson slug "${l.slug}"`);
    }
    seenSlugs.add(l.slug);
  }

  for (const l of lessons) {
    if (!byId.has(l.moduleId)) {
      throw new Error(
        `Curriculum: unknown module "${l.moduleId}" referenced by lesson "${l.slug}"`,
      );
    }
  }

  const orderedModules = [...modules].sort((a, b) => a.order - b.order);

  const builtModules: ModuleWithLessons[] = orderedModules.map((m) => {
    const own = lessons
      .filter((l) => l.moduleId === m.id)
      .sort((a, b) => a.order - b.order);

    if (own.length === 0) {
      throw new Error(`Curriculum: module "${m.id}" has no lessons`);
    }

    const seen = new Set<number>();
    for (const l of own) {
      if (seen.has(l.order)) {
        throw new Error(
          `Curriculum: duplicate order ${l.order} in module "${m.id}"`,
        );
      }
      seen.add(l.order);
    }

    return { ...m, lessons: own };
  });

  const sequence = builtModules.flatMap((m) => m.lessons);
  return { modules: builtModules, sequence };
}

export interface Adjacent {
  prev: LessonMeta | null;
  next: LessonMeta | null;
}

export function adjacent(curriculum: Curriculum, slug: string): Adjacent {
  const seq = curriculum.sequence;
  const i = seq.findIndex((l) => l.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? seq[i - 1] : null,
    next: i < seq.length - 1 ? seq[i + 1] : null,
  };
}
