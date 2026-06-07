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
    <article className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-xl shadow-black/20">
      <div className="border-b border-zinc-800 bg-zinc-900/45 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-zinc-100">
            {question.title}
          </h1>
          <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-3 py-1 text-[11px] font-semibold uppercase text-zinc-300">
            Difficulty hidden
          </span>
        </div>

        {question.externalUrl && (
          <p className="mt-3 text-xs text-zinc-500">
            Sourced from{' '}
            <a
              href={question.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-100 hover:text-brand-50"
            >
              {sourceLabel}
            </a>
          </p>
        )}

        {visibleTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleTags.slice(0, 10).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div>
          <h2 className="text-xs font-semibold uppercase text-zinc-500">Problem</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
            {question.description}
          </p>
        </div>

        {question.constraints && (
          <div className="mt-6 border-t border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold uppercase text-zinc-500">Constraints</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
              {question.constraints}
            </p>
          </div>
        )}

        {question.examples?.length > 0 && (
          <div className="mt-6 border-t border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold uppercase text-zinc-500">Examples</h3>
            <div className="mt-3 grid gap-3">
              {question.examples.map((ex, idx) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-4">
                  <p className="text-sm font-semibold text-zinc-200">Example {idx + 1}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <ExampleBlock label="Input" value={ex.input} />
                    <ExampleBlock label="Output" value={ex.output} />
                  </div>
                  {ex.explanation && (
                    <p className="mt-3 text-sm text-zinc-400">{ex.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {onStart && (
          <button
            type="button"
            onClick={onStart}
            className="mt-6 w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-950/30 hover:bg-brand-700 sm:w-auto"
          >
            {startLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function ExampleBlock({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-zinc-500">{label}</p>
      <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-black/30 p-3 text-xs leading-5 text-zinc-200">
        {value}
      </pre>
    </div>
  );
}
