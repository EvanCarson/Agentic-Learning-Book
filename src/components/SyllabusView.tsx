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
  const total = curriculum.sequence.length;
  const doneCount = curriculum.sequence.filter((l) => isComplete(l.slug)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div>
      <div className="card mb-8 p-5">
        <div className="mb-2 flex items-center justify-between text-sm font-medium">
          <span className="text-slate-700 dark:text-slate-300">Your progress</span>
          <span className="text-slate-500">{doneCount} of {total} complete</span>
        </div>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
      </div>
      {continueSlug && (
        <a
          href={`/learn/${continueSlug}`}
          className="btn-primary mb-10"
        >
          Continue where you left off →
        </a>
      )}
      {curriculum.modules.map((m) => {
            const mDone = m.lessons.filter((l) => isComplete(l.slug)).length;
            const mPct = m.lessons.length ? Math.round((mDone / m.lessons.length) * 100) : 0;
            return (
        <section key={m.id} className="card mb-6 p-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{m.title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{m.summary}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="progress max-w-xs"><span style={{ width: `${mPct}%` }} /></div>
            <span className="text-xs text-slate-500">{mDone}/{m.lessons.length}</span>
          </div>
          <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {m.lessons.map((l) => {
              const done = isComplete(l.slug);
              return (
                <li key={l.slug}>
                  <a
                    href={`/learn/${l.slug}`}
                    className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span aria-hidden="true" className={done ? "text-accent-600" : "text-slate-300 dark:text-slate-600"}>{done ? "✓" : "○"}</span>
                    <span className="font-medium text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">{l.title}</span>
                    {done && <span className="sr-only"> (completed)</span>}
                    <span className="badge ml-auto">
                      {l.type} · {l.estMinutes} min
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
            );
      })}
    </div>
  );
}
