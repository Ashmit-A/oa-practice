import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Random Questions',
    description: 'Practice with a fresh randomly selected coding problem anytime.',
  },
  {
    title: 'Daily Contest',
    description: 'Complete a new challenge every day to build consistent interview prep habits.',
  },
  {
    title: 'OA Simulation',
    description: 'Experience fullscreen, camera, microphone, and tab-switch monitoring like real OAs.',
  },
  {
    title: 'Code Execution',
    description: 'Run against sample tests and submit for full evaluation with detailed verdicts.',
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-800 bg-gradient-to-br from-stone-950 via-stone-900 to-brand-900/25">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-500">
              Online Assessment Practice
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-stone-100 sm:text-5xl lg:text-6xl">
              Simulate real coding assessments before the interview
            </h1>
            <p className="mt-6 text-lg text-stone-300">
              No login required. Start practicing immediately with realistic monitoring, an integrated
              code editor, and instant evaluation powered by Judge0.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/random"
                className="rounded-xl bg-brand-600 px-8 py-4 text-center font-semibold text-white transition hover:bg-brand-700"
              >
                Start Practice
              </Link>
              <Link
                to="/daily"
                className="rounded-xl border border-stone-600 bg-stone-900/60 px-8 py-4 text-center font-semibold text-stone-100 transition hover:bg-stone-800"
              >
                Daily Contest
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-3xl font-bold text-stone-100">Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-stone-800 bg-stone-900/30 p-6 transition hover:border-brand-500/40"
            >
              <h3 className="text-lg font-semibold text-stone-100">{feature.title}</h3>
              <p className="mt-3 text-sm text-stone-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-800 bg-stone-900/20">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-stone-100">Ready to begin?</h2>
          <p className="mt-3 text-stone-400">
            Choose a random question or take on today&apos;s daily challenge.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/random"
              className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Random Question
            </Link>
            <Link
              to="/daily"
              className="rounded-xl border border-stone-600 px-8 py-3 font-semibold text-stone-100 hover:bg-stone-800"
            >
              Daily Contest
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
