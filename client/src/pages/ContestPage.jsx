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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-100">Contest Mode</h1>
        <p className="mt-2 text-stone-400">
          3 consecutive questions. 30 minutes per question (90 minutes total).
        </p>
      </div>

      <div className="rounded-2xl border border-stone-800 bg-stone-950/40 p-6">
        <h2 className="text-lg font-semibold text-stone-100">Rules</h2>
        <ul className="mt-3 space-y-1 text-sm text-stone-300">
          <li>Fullscreen + tab-switch monitoring is enabled once you start.</li>
          <li>Free movement between questions at any time.</li>
          <li>Verdicts are revealed only after the full contest is submitted.</li>
          <li>After finishing, you can open the original source statement for each problem.</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}

      {loading && <Loader message="Preparing contest..." />}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startContest}
          disabled={loading}
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Start Contest
        </button>

        {activeContest && (
          <>
            <button
              type="button"
              onClick={resumeContest}
              disabled={loading}
              className="rounded-xl border border-stone-700 bg-stone-900/50 px-6 py-3 font-semibold text-stone-100 hover:bg-stone-800 disabled:opacity-50"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={clearContest}
              disabled={loading}
              className="rounded-xl border border-stone-700 px-6 py-3 font-semibold text-stone-200 hover:bg-stone-900 disabled:opacity-50"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
