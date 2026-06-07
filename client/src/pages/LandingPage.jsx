import { Link } from 'react-router-dom';

const workflows = [
  ['Pick', 'Random, daily, or contest mode'],
  ['Code', 'Monaco editor with starter code'],
  ['Verify', 'Sample runs before submission'],
  ['Review', 'Verdicts, timing, and monitoring'],
];

const sampleRows = [
  ['Test 1', 'Accepted', '42 ms'],
  ['Test 2', 'Accepted', '38 ms'],
  ['Hidden', 'Queued', '--'],
];

export default function LandingPage() {
  return (
    <div>
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-500">
              Online assessment practice
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Practice coding assessments in the same rhythm you will take them.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Start with a real problem, write code in-browser, run sample tests, submit against the
              full judge, and review your result with assessment-style monitoring.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/random"
                className="rounded-lg bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-brand-950/30 hover:bg-brand-700"
              >
                Start Practice
              </Link>
              <Link
                to="/contest"
                className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-center font-semibold text-zinc-100 hover:bg-zinc-800"
              >
                Try Contest Mode
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-4">
              {workflows.map(([label, copy]) => (
                <div key={label} className="border-l border-zinc-800 pl-3">
                  <p className="text-sm font-semibold text-zinc-100">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500">Live Preview</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">Subset Sum</p>
              </div>
              <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-100">
                38:12
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
              <div className="border-b border-zinc-800 p-4 md:border-b-0 md:border-r">
                <p className="text-xs font-semibold uppercase text-zinc-500">Prompt</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Given an array and a target sum, determine whether a subset exists with that sum.
                </p>
                <pre className="mt-4 rounded-md bg-black/30 p-3 text-xs leading-5 text-zinc-300">
{`Input
3 34 4 12 5 2
9

Output
true`}
                </pre>
              </div>
              <div className="p-4">
                <div className="rounded-md border border-zinc-800 bg-black/30">
                  <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-500">
                    solution.py
                  </div>
                  <pre className="p-3 text-xs leading-5 text-zinc-200">
{`import sys

def solve(data):
    nums, target = parse(data)
    print(can_make(nums, target))`}
                  </pre>
                </div>
                <div className="mt-4 overflow-hidden rounded-md border border-zinc-800">
                  {sampleRows.map(([name, status, runtime]) => (
                    <div
                      key={name}
                      className="grid grid-cols-3 border-b border-zinc-800 px-3 py-2 text-xs last:border-b-0"
                    >
                      <span className="text-zinc-300">{name}</span>
                      <span className={status === 'Accepted' ? 'text-emerald-300' : 'text-zinc-500'}>
                        {status}
                      </span>
                      <span className="text-right text-zinc-500">{runtime}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature title="Random Practice" copy="Fetch a fresh question and start a timed session." />
          <Feature title="Daily Challenge" copy="A fixed daily problem with faster accepted submissions scoring higher." />
          <Feature title="Contest Mode" copy="Three-question flow with locked verdicts until the contest is complete." />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, copy }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-5">
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p>
    </div>
  );
}
