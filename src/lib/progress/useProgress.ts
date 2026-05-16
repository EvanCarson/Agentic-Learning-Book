import { useCallback, useEffect, useState } from "react";
import { createLocalStorageProgressStore } from "./LocalStorageProgressStore";
import { PROGRESS_CHANGED_EVENT, PROGRESS_STORAGE_KEY } from "./ProgressStore";

const store = createLocalStorageProgressStore();

/**
 * React hook providing a live view of the shared progress store.
 * Re-renders consuming islands when same-tab writes dispatch
 * PROGRESS_CHANGED_EVENT or cross-tab writes to the progress key arrive
 * via the storage event. The module-level `store` singleton is
 * intentional: Astro islands are separate React roots with no shared
 * context, so the module graph (plus localStorage) is the only shared
 * state within/across tabs.
 */
export function useProgress() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = (e?: Event) => {
      if (
        e instanceof StorageEvent &&
        e.key !== null &&
        e.key !== PROGRESS_STORAGE_KEY
      ) {
        return;
      }
      setTick((t) => t + 1);
    };
    window.addEventListener(PROGRESS_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(PROGRESS_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const isComplete = useCallback(
    (slug: string) => store.isComplete(slug),
    [tick],
  );
  const setComplete = useCallback(
    (slug: string, value: boolean) => store.setComplete(slug, value),
    [],
  );
  const setLastVisited = useCallback(
    (slug: string) => store.setLastVisited(slug),
    [],
  );
  const lastVisited = useCallback(() => store.lastVisited(), [tick]);
  const all = useCallback(() => store.all(), [tick]);

  return { isComplete, setComplete, setLastVisited, lastVisited, all };
}
