import { useProgress } from "../lib/progress/useProgress";
import type { Curriculum } from "../lib/curriculum";

export default function SidebarNav({
  curriculum,
  currentSlug,
}: {
  curriculum: Curriculum;
  currentSlug: string;
}) {
  const { isComplete } = useProgress();
  return (
    <nav aria-label="Curriculum" className="text-sm">
      {curriculum.modules.map((m) => (
        <div key={m.id} className="mb-5">
          <p className="mb-2 px-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {m.title}
          </p>
          <ul className="space-y-0.5">
            {m.lessons.map((l) => {
              const active = l.slug === currentSlug;
              return (
                <li key={l.slug}>
                  <a
                    href={`/learn/${l.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex rounded-[var(--radius-md)] bg-accent-50 px-2 py-1.5 font-semibold text-accent-700 dark:bg-accent-950 dark:text-accent-200"
                        : "flex rounded-[var(--radius-md)] px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }
                  >
                    <span aria-hidden="true">
                      {isComplete(l.slug) ? "✓ " : "○ "}
                    </span>
                    {l.title}
                    {isComplete(l.slug) && (
                      <span className="sr-only"> (completed)</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
