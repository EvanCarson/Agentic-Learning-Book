import { describe, it, expect } from "vitest";
import { buildCurriculum, adjacent, type LessonMeta } from "../src/lib/curriculum";
import type { Module } from "../src/content/modules";

const mods: Module[] = [
  { id: "m1", title: "M1", order: 1, summary: "s1" },
  { id: "m2", title: "M2", order: 2, summary: "s2" },
];

const lessons: LessonMeta[] = [
  { slug: "a", moduleId: "m1", order: 2, type: "reading", title: "A", summary: "sa", estMinutes: 5 },
  { slug: "b", moduleId: "m1", order: 1, type: "interactive", title: "B", summary: "sb", estMinutes: 9 },
  { slug: "c", moduleId: "m2", order: 1, type: "quiz", title: "C", summary: "sc", estMinutes: 4 },
];

describe("buildCurriculum", () => {
  it("orders modules then lessons-within-module", () => {
    const c = buildCurriculum(mods, lessons);
    expect(c.modules.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(c.modules[0].lessons.map((l) => l.slug)).toEqual(["b", "a"]);
    expect(c.sequence.map((l) => l.slug)).toEqual(["b", "a", "c"]);
  });

  it("throws when a lesson references an unknown module", () => {
    const bad = [...lessons, { slug: "x", moduleId: "nope", order: 1, type: "reading", title: "X", summary: "s", estMinutes: 1 } as LessonMeta];
    expect(() => buildCurriculum(mods, bad)).toThrow(/unknown module "nope".*"x"/);
  });

  it("throws on duplicate (moduleId, order)", () => {
    const dup = [...lessons, { slug: "d", moduleId: "m1", order: 1, type: "reading", title: "D", summary: "s", estMinutes: 1 } as LessonMeta];
    expect(() => buildCurriculum(mods, dup)).toThrow(/duplicate order 1 in module "m1"/);
  });

  it("throws when a module has no lessons", () => {
    const mods3 = [...mods, { id: "m3", title: "M3", order: 3, summary: "s3" }];
    expect(() => buildCurriculum(mods3, lessons)).toThrow(/module "m3" has no lessons/);
  });

  it("throws on duplicate lesson slug", () => {
    const dupSlug: LessonMeta[] = [
      { slug: "a", moduleId: "m1", order: 1, type: "reading", title: "A", summary: "s", estMinutes: 1 },
      { slug: "a", moduleId: "m2", order: 1, type: "reading", title: "A2", summary: "s", estMinutes: 1 },
    ];
    expect(() => buildCurriculum(mods, dupSlug)).toThrow(/duplicate lesson slug "a"/);
  });
});

describe("adjacent", () => {
  const c = buildCurriculum(mods, lessons);
  it("null prev for first, next is second", () => {
    expect(adjacent(c, "b")).toEqual({
      prev: null,
      next: c.sequence[1],
    });
  });
  it("spans module boundary (a -> c across m1/m2)", () => {
    expect(adjacent(c, "a").next?.slug).toBe("c");
    expect(adjacent(c, "c").prev?.slug).toBe("a");
  });
  it("null next for last", () => {
    expect(adjacent(c, "c").next).toBeNull();
  });
  it("both null for unknown slug", () => {
    expect(adjacent(c, "zzz")).toEqual({ prev: null, next: null });
  });

  it("single-lesson curriculum returns both null", () => {
    const oneMod = [{ id: "m1", title: "M1", order: 1, summary: "" }];
    const oneLesson: LessonMeta[] = [
      { slug: "solo", moduleId: "m1", order: 1, type: "reading", title: "S", summary: "", estMinutes: 1 },
    ];
    const solo = buildCurriculum(oneMod, oneLesson);
    expect(adjacent(solo, "solo")).toEqual({ prev: null, next: null });
  });
});
