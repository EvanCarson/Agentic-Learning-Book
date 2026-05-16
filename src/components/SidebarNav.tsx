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
        <div key={m.id} className="mb-4">
          <p className="mb-1 font-semibold uppercase tracking-wide text-gray-500">
            {m.title}
          </p>
          <ul className="space-y-1">
            {m.lessons.map((l) => {
              const active = l.slug === currentSlug;
              return (
                <li key={l.slug}>
                  <a
                    href={`/learn/${l.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "font-semibold text-blue-600 hover:underline"
                        : "text-gray-700 hover:underline dark:text-gray-300"
                    }
                  >
                    <span aria-hidden="true">
                      {isComplete(l.slug) ? "✓ " : "○ "}
                    </span>
                    {l.title}
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
