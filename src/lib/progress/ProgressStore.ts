/**
 * Window event dispatched after a successful progress write so that
 * separate React islands (sidebar, syllabus, mark-complete) re-render
 * on same-tab changes. Listeners must use this exact constant.
 */
export const PROGRESS_CHANGED_EVENT = "alb:progress-changed";

/** localStorage key under which progress is persisted. */
export const PROGRESS_STORAGE_KEY = "alb:progress";

/**
 * Swappable progress persistence seam. This slice ships a synchronous
 * localStorage implementation. A future Supabase implementation MUST keep
 * this synchronous contract by hydrating all progress into a local cache
 * on mount and serving reads from that cache (writes fire-and-forget to
 * the backend). Do not make this interface async without updating every
 * consumer.
 */
export interface ProgressStore {
  isComplete(slug: string): boolean;
  setComplete(slug: string, value: boolean): void;
  lastVisited(): string | null;
  setLastVisited(slug: string): void;
  all(): Record<string, boolean>;
}
