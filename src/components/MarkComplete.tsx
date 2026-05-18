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
          ? "btn-primary bg-emerald-700 hover:bg-emerald-800"
          : "btn-secondary"
      }
    >
      {done ? (<><span aria-hidden="true">✓</span> Completed</>) : "Mark complete"}
    </button>
  );
}
