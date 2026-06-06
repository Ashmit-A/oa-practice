const hiddenTags = new Set([
  'mathematics',
  'math',
  'algorithms',
  'algorithm',
  'cpp',
  'c++',
  'java',
  'python',
  'javascript',
]);

function filterTags(tags = []) {
  return tags.filter((tag) => !hiddenTags.has(String(tag || '').trim().toLowerCase()));
}

export default function QuestionCard({ question, onStart, startLabel = 'Start Assessment' }) {
  if (!question) return null;

  const sourceLabel =
    question.source === 'gfg'
      ? 'GeeksforGeeks'
      : question.source === 'leetcode'
        ? 'LeetCode'
        : 'Source';

  const visibleTags = filterTags(question.tags);

  return (
    <article className="rounded-2xl border border-stone-800 bg-stone-950/40 p-6 shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-100">{question.title}</h1>
        <span className="rounded-full border border-stone-700 bg-stone-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-300">
          Difficulty hidden
        </span>
      </div>

      {question.externalUrl && (
        <p className="mb-4 text-xs text-stone-500">
          Sourced from{' '}
          <a
            href={question.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-100 hover:underline"
          >
            {sourceLabel}
          </a>
        </p>
      )}

      {visibleTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-stone-800 bg-stone-900/40 px-2 py-1 text-xs text-stone-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="prose prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-stone-200">{question.description}</p>
      </div>

      {question.constraints && (
        <div className="mt-4 rounded-lg border border-stone-800 bg-stone-950/40 p-4">
          <h3 className="mb-2 text-sm font-semibold text-stone-200">Constraints</h3>
          <p className="whitespace-pre-wrap text-sm text-stone-400">{question.constraints}</p>
        </div>
      )}

      {question.examples?.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-stone-200">Examples</h3>
          {question.examples.map((ex, idx) => (
            <div key={idx} className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
              <p className="text-sm">
                <span className="font-medium text-stone-300">Input:</span>{' '}
                <code className="text-brand-100">{ex.input}</code>
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium text-stone-300">Output:</span>{' '}
                <code className="text-amber-200">{ex.output}</code>
              </p>
              {ex.explanation && (
                <p className="mt-2 text-sm text-stone-400">{ex.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {onStart && (
        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
        >
          {startLabel}
        </button>
      )}
    </article>
  );
}
