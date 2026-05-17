import { describe, it, expect, beforeEach } from "vitest";
import { createLocalStorageProgressStore } from "../src/lib/progress/LocalStorageProgressStore";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe("LocalStorageProgressStore", () => {
  let storage: Storage;
  beforeEach(() => { storage = memoryStorage(); });

  it("round-trips completion and lastVisited", () => {
    const s = createLocalStorageProgressStore(storage);
    expect(s.isComplete("a")).toBe(false);
    s.setComplete("a", true);
    s.setLastVisited("a");
    const s2 = createLocalStorageProgressStore(storage);
    expect(s2.isComplete("a")).toBe(true);
    expect(s2.lastVisited()).toBe("a");
    expect(s2.all()).toEqual({ a: true });
  });

  it("setComplete(false) clears completion", () => {
    const s = createLocalStorageProgressStore(storage);
    s.setComplete("a", true);
    s.setComplete("a", false);
    expect(s.isComplete("a")).toBe(false);
  });

  it("recovers from corrupt JSON without throwing", () => {
    storage.setItem("alb:progress", "{not json");
    const s = createLocalStorageProgressStore(storage);
    expect(s.isComplete("a")).toBe(false);
    expect(() => s.setComplete("a", true)).not.toThrow();
    expect(s.isComplete("a")).toBe(true);
  });

  it("falls back to memory when storage access throws", () => {
    const throwing = {
      get length() { return 0; },
      clear: () => {},
      getItem: () => { throw new Error("blocked"); },
      key: () => null,
      removeItem: () => {},
      setItem: () => { throw new Error("blocked"); },
    } as Storage;
    const s = createLocalStorageProgressStore(throwing);
    expect(s.isComplete("a")).toBe(false);
    expect(() => s.setComplete("a", true)).not.toThrow();
    expect(s.isComplete("a")).toBe(true); // held in memory
  });
});
