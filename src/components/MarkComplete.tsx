import { useProgress } from "../lib/progress/useProgress";

export default function MarkComplete({ slug }: { slug: string }) {
  const { isComplete, setComplete } = useProgress();
  const done = isComplete(slug);
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => setComplete(slug, !done)}
      className={
        done
          ? "rounded bg-green-600 px-4 py-2 text-sm font-medium text-white"
          : "rounded border border-gray-400 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
      }
    >
      {done ? "✓ Completed" : "Mark complete"}
    </button>
  );
}
