import { describe, it, expect } from "vitest";
import { getAdjacentTutorials, type NavEntry } from "../src/lib/navigation";

const entries: NavEntry[] = [
  { slug: "a", title: "A", order: 1 },
  { slug: "b", title: "B", order: 2 },
  { slug: "c", title: "C", order: 3 },
];

describe("getAdjacentTutorials", () => {
  it("returns null prev and the next for the first entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "a");
    expect(prev).toBeNull();
    expect(next?.slug).toBe("b");
  });

  it("returns surrounding entries for a middle entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "b");
    expect(prev?.slug).toBe("a");
    expect(next?.slug).toBe("c");
  });

  it("returns null next for the last entry", () => {
    const { prev, next } = getAdjacentTutorials(entries, "c");
    expect(prev?.slug).toBe("b");
    expect(next).toBeNull();
  });

  it("sorts unsorted input by order before computing neighbors", () => {
    const shuffled = [entries[2], entries[0], entries[1]];
    const { prev, next } = getAdjacentTutorials(shuffled, "b");
    expect(prev?.slug).toBe("a");
    expect(next?.slug).toBe("c");
  });

  it("returns both null when slug is not found", () => {
    const { prev, next } = getAdjacentTutorials(entries, "missing");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});
