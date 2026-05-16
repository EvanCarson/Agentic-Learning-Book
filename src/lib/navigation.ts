export interface NavEntry {
  slug: string;
  title: string;
  order: number;
}

export interface AdjacentTutorials {
  prev: NavEntry | null;
  next: NavEntry | null;
}

export function getAdjacentTutorials(
  entries: NavEntry[],
  currentSlug: string,
): AdjacentTutorials {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((e) => e.slug === currentSlug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? sorted[i - 1] : null,
    next: i < sorted.length - 1 ? sorted[i + 1] : null,
  };
}
