import type { ProgressStore } from "./ProgressStore";
import { PROGRESS_CHANGED_EVENT } from "./ProgressStore";

const KEY = "alb:progress";

interface Shape {
  completed: Record<string, boolean>;
  lastVisited: string | null;
}

function emptyShape(): Shape {
  return { completed: {}, lastVisited: null };
}

export function createLocalStorageProgressStore(
  backing?: Storage,
): ProgressStore {
  // globalThis for storage detection (SSR/Workers-safe); window is only touched for DOM events in write().
  const storage: Storage | null =
    backing ??
    (typeof globalThis !== "undefined" &&
    (globalThis as { localStorage?: Storage }).localStorage
      ? (globalThis as { localStorage: Storage }).localStorage
      : null);

  let memory: Shape = emptyShape();

  function read(): Shape {
    if (!storage) return memory;
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return emptyShape();
      const parsed = JSON.parse(raw) as Partial<Shape>;
      return {
        completed: parsed.completed ?? {},
        lastVisited: parsed.lastVisited ?? null,
      };
    } catch {
      return memory;
    }
  }

  function write(next: Shape): void {
    memory = next;
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
      }
    } catch {
      /* memory already updated; ignore */
    }
  }

  return {
    isComplete: (slug) => read().completed[slug] === true,
    setComplete: (slug, value) => {
      const s = read();
      const completed = { ...s.completed };
      if (value) completed[slug] = true;
      else delete completed[slug];
      write({ ...s, completed });
    },
    lastVisited: () => read().lastVisited,
    setLastVisited: (slug) => {
      const s = read();
      write({ ...s, lastVisited: slug });
    },
    all: () => ({ ...read().completed }),
  };
}
