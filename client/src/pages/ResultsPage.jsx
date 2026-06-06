import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { assessmentApi, questionsApi } from '../api/client';
import Loader from '../components/Loader';
import ResultCard from '../components/ResultCard';

const difficultyColors = {
  Easy: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
  Medium: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  Hard: 'bg-rose-500/15 text-rose-200 border-rose-500/25',
};

const CONTEST_KEY = 'oa_practice_contest_v1';

export default function ResultsPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await assessmentApi.getResult(submissionId);
        const res = data.data;
        setResult(res);
        if (res.questionId) {
          const { data: qData } = await questionsApi.getById(res.questionId);
          setQuestion(qData.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Loader message="Loading results..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      </div>
    );
  }

  const passed = result.testResults?.filter((t) => t.passed) || [];
  const failed = result.testResults?.filter((t) => !t.passed) || [];
  const visibleFailed = failed.filter((t) => !t.isHidden);
  const hiddenFailed = failed.filter((t) => t.isHidden);

  let contest = null;
  try {
    contest = JSON.parse(localStorage.getItem(CONTEST_KEY) || 'null');
  } catch {
    contest = null;
  }
  const contestIndex = contest?.questionIds?.indexOf(result.questionId);
  const inContest = result.mode === 'contest' && typeof contestIndex === 'number' && contestIndex >= 0;
  const contestComplete =
    inContest && (contest?.questionIds || []).every((id) => Boolean(contest?.submissions?.[id]));
  const nextContestQuestionId =
    inContest && contestIndex < contest.questionIds.length - 1
      ? contest.questionIds[contestIndex + 1]
      : null;

  if (inContest && !contestComplete) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/40 p-6">
          <h1 className="text-2xl font-semibold text-stone-100">Contest Results Locked</h1>
          <p className="mt-2 text-stone-400">
            This submission is part of a contest. Verdicts are shown only after the full contest is
            submitted.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/contest"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Go to contest
            </Link>
            {nextContestQuestionId && (
              <button
                type="button"
                onClick={() => navigate(`/assessment/${nextContestQuestionId}?mode=contest`)}
                className="rounded-xl border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:bg-stone-900"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-100">
            Assessment Results
          </h1>
          <p className="mt-1 text-stone-400">
            Submission summary, test details, and monitoring report.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/random"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New Question
          </Link>
          {nextContestQuestionId && (
            <button
              type="button"
              onClick={() => navigate(`/assessment/${nextContestQuestionId}?mode=contest`)}
              className="rounded-xl border border-brand-600/50 bg-brand-600/15 px-5 py-2.5 text-sm font-semibold text-brand-100 hover:bg-brand-600/25"
            >
              Next Question
            </button>
          )}
          {inContest && !nextContestQuestionId && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(CONTEST_KEY);
                navigate('/contest');
              }}
              className="rounded-xl border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:bg-stone-900"
            >
              Finish Contest
            </button>
          )}
          <Link
            to="/daily"
            className="rounded-xl border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:bg-stone-900"
          >
            Daily
          </Link>
        </div>
      </div>

      {question && (
        <div className="rounded-2xl border border-stone-800 bg-stone-950/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Question
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-100">{question.title}</h2>
              {question.externalUrl && (
                <a
                  href={question.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand-100 hover:underline"
                >
                  Open original problem statement
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  difficultyColors[question.difficulty] || difficultyColors.Medium
                }`}
              >
                {question.difficulty}
              </span>
              {typeof result.timeTakenSeconds === 'number' && (
                <span className="rounded-full border border-stone-700 bg-stone-900/60 px-3 py-1 text-xs font-semibold text-stone-200">
                  Time: {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
                </span>
              )}
              {result.mode === 'daily' && typeof result.score === 'number' && (
                <span className="rounded-full border border-brand-600/40 bg-brand-600/15 px-3 py-1 text-xs font-semibold text-brand-100">
                  Points: {result.score}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <ResultCard result={result} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TestCaseSummary title="Passed" cases={passed} variant="passed" />
        <TestCaseSummary title="Failed" cases={failed} variant="failed" />
      </div>

      {failed.length > 0 && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-6">
          <h2 className="text-lg font-semibold text-stone-100">Failure Details</h2>
          <p className="mt-1 text-sm text-stone-400">
            Hidden testcases do not show inputs/outputs.
          </p>

          <div className="mt-5 space-y-4">
            {visibleFailed.length === 0 ? (
              <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-4 text-sm text-stone-400">
                Only hidden testcases failed ({hiddenFailed.length}).
              </div>
            ) : (
              visibleFailed.map((tc, idx) => <TestCaseDetail key={idx} tc={tc} />)
            )}
          </div>
        </div>
      )}

      {result.monitoringSummary && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-6">
          <h2 className="text-lg font-semibold text-stone-100">Monitoring Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryItem label="Tab Switches" value={result.monitoringSummary.tabSwitchCount} />
            <SummaryItem label="Fullscreen Exits" value={result.monitoringSummary.fullscreenExitCount} />
            <SummaryItem label="Window Blurs" value={result.monitoringSummary.windowBlurCount} />
            <SummaryItem label="Camera" value={result.monitoringSummary.cameraStatus} />
            <SummaryItem label="Microphone" value={result.monitoringSummary.microphoneStatus} />
            <SummaryItem label="Display" value={result.monitoringSummary.displayDetection} />
          </div>
        </div>
      )}
    </div>
  );
}

function TestCaseSummary({ title, cases, variant }) {
  const border =
    variant === 'passed' ? 'border-emerald-500/30' : 'border-rose-500/30';

  return (
    <div className={`rounded-2xl border ${border} bg-stone-900/30 p-5`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
        {title}
      </h3>
      <p className="mt-2 text-3xl font-semibold text-stone-100">{cases.length}</p>
      <p className="mt-1 text-sm text-stone-400">Testcases</p>
    </div>
  );
}

function TestCaseDetail({ tc }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-stone-100">
          Test {tc.testCaseIndex + 1}: {tc.verdict}
        </p>
        {tc.runtimeMs !== undefined && (
          <p className="text-xs text-stone-500">{tc.runtimeMs} ms</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Input
          </p>
          <pre className="mt-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-stone-200">
            {tc.input || ''}
          </pre>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Expected
          </p>
          <pre className="mt-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-stone-200">
            {tc.expectedOutput || ''}
          </pre>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Got
          </p>
          <pre className="mt-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-stone-200">
            {tc.actualOutput || ''}
          </pre>
        </div>
      </div>

      {tc.stderr && (
        <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          {tc.stderr}
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-semibold capitalize text-stone-100">{value}</p>
    </div>
  );
}
