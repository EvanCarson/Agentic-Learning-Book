export default function QuizStub({ title }: { title: string }) {
  return (
    <div
      role="note"
      aria-label={`Quiz: ${title}`}
      className="my-6 rounded border border-dashed border-gray-400 p-6 text-center dark:border-gray-600"
    >
      <p className="text-lg font-semibold">Quiz: {title}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Knowledge checks are coming soon. For now, review the lesson and
        mark it complete when you are confident.
      </p>
    </div>
  );
}
