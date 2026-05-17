import { describe, it, expect } from "vitest";
import { toLessonMeta } from "../src/lib/toLessonMeta";

describe("toLessonMeta", () => {
  it("maps a collection entry to LessonMeta (id -> slug)", () => {
    const entry = {
      id: "01-what-is-an-agent",
      data: {
        title: "What Is an Agent?",
        moduleId: "foundations",
        order: 1,
        type: "interactive" as const,
        summary: "The loop.",
        estMinutes: 10,
      },
    };
    expect(toLessonMeta(entry as Parameters<typeof toLessonMeta>[0])).toEqual({
      slug: "01-what-is-an-agent",
      moduleId: "foundations",
      order: 1,
      type: "interactive",
      title: "What Is an Agent?",
      summary: "The loop.",
      estMinutes: 10,
    });
  });
});
