const verdictStyles = {
  Accepted: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  'Wrong Answer': 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  'Runtime Error': 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  'Compilation Error': 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  'Time Limit Exceeded': 'text-purple-300 bg-purple-500/10 border-purple-500/25',
  'Internal Error': 'text-stone-300 bg-stone-500/10 border-stone-500/25',
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const style = verdictStyles[result.verdict] || verdictStyles['Internal Error'];

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Verdict
          </p>
          <p className={`mt-2 inline-flex items-center rounded-xl border px-5 py-3 text-2xl font-bold ${style}`}>
            {result.verdict}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Passed" value={`${result.passedTestCases}/${result.totalTestCases}`} />
          <Stat label="Runtime" value={`${result.runtimeMs} ms`} />
          <Stat label="Memory" value={`${result.memoryKb} KB`} />
          <Stat label="Submitted" value={new Date(result.submittedAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-sm font-semibold text-stone-200">{value}</p>
    </div>
  );
}
