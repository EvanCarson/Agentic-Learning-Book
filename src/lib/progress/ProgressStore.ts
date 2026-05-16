export interface ProgressStore {
  isComplete(slug: string): boolean;
  setComplete(slug: string, value: boolean): void;
  lastVisited(): string | null;
  setLastVisited(slug: string): void;
  all(): Record<string, boolean>;
}
