import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentApi, questionsApi } from '../api/client';
import Loader from '../components/Loader';

const CONTEST_KEY = 'oa_practice_contest_v1';

function loadContest() {
  try {
    return JSON.parse(localStorage.getItem(CONTEST_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function ContestResultsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const contest = loadContest();
        if (!contest?.questionIds?.length) {
          setError('No contest results available.');
          setLoading(false);
          return;
        }

        const missing = contest.questionIds.filter((id) => !contest.submissions?.[id]);
        if (missing.length) {
          setError('Contest is not fully submitted yet.');
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          contest.questionIds.map(async (qid) => {
            const submissionId = contest.submissions[qid];
            const [{ data: rData }, { data: qData }] = await Promise.all([
              assessmentApi.getResult(submissionId),
              questionsApi.getById(qid),
            ]);
            return { questionId: qid, submissionId, result: rData.data, question: qData.data };
          })
        );

        setItems(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Loader message="Loading contest results..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      </div>
    );
  }

  const totalScore = items.reduce((sum, item) => sum + (item.result.score || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-100">Contest Results</h1>
          <p className="mt-1 text-stone-400">
            Verdicts are revealed now that the full contest has been submitted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-brand-600/40 bg-brand-600/15 px-4 py-2 text-sm font-semibold text-brand-100">
            Total points: {totalScore}
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(CONTEST_KEY);
              navigate('/contest');
            }}
            className="rounded-xl border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:bg-stone-900"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item, idx) => (
          <div
            key={item.submissionId}
            className="rounded-2xl border border-stone-800 bg-stone-950/40 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Question {idx + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-100">{item.question.title}</h2>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-300">
                  <span className="rounded-full border border-stone-700 bg-stone-900/60 px-3 py-1 text-xs font-semibold">
                    {item.result.verdict}
                  </span>
                  <span className="rounded-full border border-stone-700 bg-stone-900/60 px-3 py-1 text-xs font-semibold">
                    {item.result.passedTestCases}/{item.result.totalTestCases} tests
                  </span>
                  <span className="rounded-full border border-stone-700 bg-stone-900/60 px-3 py-1 text-xs font-semibold">
                    Points: {item.result.score || 0}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/results/${item.submissionId}`}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  View details
                </Link>
                {item.question.externalUrl && (
                  <a
                    href={item.question.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:bg-stone-900"
                  >
                    Original statement
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

