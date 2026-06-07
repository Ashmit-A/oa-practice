import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/client';
import Loader from '../components/Loader';

const CONTEST_KEY = 'oa_practice_contest_v1';

function createContestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `contest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ContestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeContest, setActiveContest] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONTEST_KEY);
      if (!raw) return;
      setActiveContest(JSON.parse(raw));
    } catch {
      localStorage.removeItem(CONTEST_KEY);
    }
  }, []);

  const startContest = async () => {
    setLoading(true);
    setError('');
    try {
      const responses = await Promise.all([
        questionsApi.getRandom(),
        questionsApi.getRandom(),
        questionsApi.getRandom(),
      ]);
      const questionIds = responses.map((r) => r.data.data.id);
      const contest = {
        contestId: createContestId(),
        questionIds,
        startedAt: Date.now(),
        submissions: {},
        drafts: {},
      };
      localStorage.setItem(CONTEST_KEY, JSON.stringify(contest));
      navigate(`/assessment/${questionIds[0]}?mode=contest`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resumeContest = () => {
    if (!activeContest?.questionIds?.[0]) return;
    navigate(`/assessment/${activeContest.questionIds[0]}?mode=contest`);
  };

  const clearContest = () => {
    localStorage.removeItem(CONTEST_KEY);
    setActiveContest(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <div className="border-b border-zinc-800 pb-5">
        <p className="text-sm font-semibold uppercase text-brand-500">Assessment flow</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">Contest Mode</h1>
        <p className="mt-2 text-zinc-400">
          3 consecutive questions. 30 minutes per question (90 minutes total).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['3', 'Questions'],
          ['30m', 'Each question'],
          ['Locked', 'Verdicts'],
          ['Live', 'Monitoring'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-4">
            <p className="text-2xl font-semibold text-zinc-100">{value}</p>
            <p className="mt-1 text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Rules</h2>
        <ul className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
          <li className="rounded-md bg-zinc-900/45 p-3">Fullscreen and tab-switch monitoring begin once you start.</li>
          <li className="rounded-md bg-zinc-900/45 p-3">Move between questions while the contest is active.</li>
          <li className="rounded-md bg-zinc-900/45 p-3">Verdicts unlock after all contest questions are submitted.</li>
          <li className="rounded-md bg-zinc-900/45 p-3">Original source statements remain available after finishing.</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}

      {loading && <Loader message="Preparing contest..." />}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startContest}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-950/30 hover:bg-brand-700 disabled:opacity-50"
        >
          Start Contest
        </button>

        {activeContest && (
          <>
            <button
              type="button"
              onClick={resumeContest}
              disabled={loading}
              className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 font-semibold text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={clearContest}
              disabled={loading}
              className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
