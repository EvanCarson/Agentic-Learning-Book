import { useCallback, useEffect, useState } from "react";
import { createLocalStorageProgressStore } from "./LocalStorageProgressStore";
import { PROGRESS_CHANGED_EVENT } from "./ProgressStore";

const store = createLocalStorageProgressStore();

export function useProgress() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
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
