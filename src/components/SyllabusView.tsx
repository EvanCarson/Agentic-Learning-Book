import { useProgress } from "../lib/progress/useProgress";
import type { Curriculum } from "../lib/curriculum";

export default function SyllabusView({
  curriculum,
}: {
  curriculum: Curriculum;
}) {
  const { isComplete, lastVisited } = useProgress();
  const knownSlugs = new Set(curriculum.sequence.map((l) => l.slug));
  const rawLast = lastVisited();
  const last = rawLast && knownSlugs.has(rawLast) ? rawLast : null;
  const firstIncomplete = curriculum.sequence.find((l) => !isComplete(l.slug));
  const continueSlug = last ?? firstIncomplete?.slug ?? curriculum.sequence[0]?.slug;

  return (
    <div>
      {continueSlug && (
        <a
          href={`/learn/${continueSlug}`}
          className="mb-8 inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Continue where you left off →
        </a>
      )}
      {curriculum.modules.map((m) => (
        <section key={m.id} className="mb-10">
          <h2 className="text-2xl font-bold">{m.title}</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{m.summary}</p>
          <ul className="mt-4 space-y-2">
            {m.lessons.map((l) => {
              const done = isComplete(l.slug);
              return (
                <li key={l.slug}>
                  <a
                    href={`/learn/${l.slug}`}
                    className="flex items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    <span aria-hidden="true">{done ? "✓" : "○"}</span>
                    <span className="font-medium">{l.title}</span>
                    {done && <span className="sr-only"> (completed)</span>}
                    <span className="ml-auto text-xs uppercase tracking-wide text-gray-500">
                      {l.type} · {l.estMinutes} min
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
