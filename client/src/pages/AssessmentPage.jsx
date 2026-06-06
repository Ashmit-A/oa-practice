import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assessmentApi, questionsApi } from '../api/client';
import CodeEditor from '../components/CodeEditor';
import CompliancePanel from '../components/CompliancePanel';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import QuestionCard from '../components/QuestionCard';
import CameraPreview from '../components/CameraPreview';
import SideDrawer from '../components/SideDrawer';
import { useOAMonitoring } from '../hooks/useOAMonitoring';

const CONTEST_KEY = 'oa_practice_contest_v1';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const MODE_DURATIONS_SECONDS = {
  random: 40 * 60,
  daily: 40 * 60,
  contest: 30 * 60,
};

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

function formatClock(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(clamped / 60)).padStart(2, '0');
  const ss = String(clamped % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function loadContest() {
  try {
    return JSON.parse(localStorage.getItem(CONTEST_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveContest(contest) {
  localStorage.setItem(CONTEST_KEY, JSON.stringify(contest));
}

export default function AssessmentPage() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'random';
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const [drawer, setDrawer] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [contest, setContest] = useState(null);
  const layoutRef = useRef(null);
  const timeoutHandledRef = useRef(false);
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const draftFlushRef = useRef(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const { compliance, initializeAssessment, logEvent } = useOAMonitoring(sessionId, initialized, {
    onViolation: ({ message }) => {
      setModal({ open: true, title: 'Warning', message });
    },
  });

  useEffect(() => {
    if (!initialized) return;

    let dragging = false;

    const handleMove = (event) => {
      if (!dragging) return;
      const left = layoutRef.current?.getBoundingClientRect().left ?? 0;
      const next = Math.min(640, Math.max(280, event.clientX - left));
      setSidebarWidth(next);
    };

    const handleUp = () => {
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleDown = () => {
      dragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const divider = document.getElementById('oa-sidebar-divider');
    divider?.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      divider?.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [initialized]);

  useEffect(() => {
    const init = async () => {
      try {
        if (mode === 'contest') {
          const c = loadContest();
          if (!c?.questionIds?.length) {
            setError('No active contest found. Start a new contest to continue.');
            setLoading(false);
            return;
          }
          setContest(c);
        } else {
          setContest(null);
        }

        const { data: qRes } = await questionsApi.getById(questionId);
        const q = qRes.data;
        setQuestion(q);
        if (mode === 'contest') {
          const c = loadContest();
          const draft = c?.drafts?.[questionId]?.python;
          setCode(draft ?? q.starterCode?.python ?? '');
        } else {
          setCode(q.starterCode?.python || '');
        }

        const { data: sRes } = await assessmentApi.start(questionId, mode);
        const session = sRes.data;
        setSessionId(session.sessionId);

        const durationSeconds =
          session.durationSeconds ?? MODE_DURATIONS_SECONDS[mode] ?? MODE_DURATIONS_SECONDS.random;
        const sessionStartedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
        const sessionExpiresAt = session.expiresAt
          ? new Date(session.expiresAt).getTime()
          : sessionStartedAt + durationSeconds * 1000;
        setExpiresAt(sessionExpiresAt);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [questionId, mode]);

  useEffect(() => {
    if (question?.starterCode?.[language]) {
      if (mode === 'contest') {
        const c = loadContest();
        const draft = c?.drafts?.[questionId]?.[language];
        setCode(draft ?? question.starterCode[language]);
      } else {
        setCode(question.starterCode[language]);
      }
    }
  }, [language, question, mode, questionId]);

  useEffect(() => {
    if (mode !== 'contest') return;
    if (!contest?.contestId) return;

    if (draftFlushRef.current) window.clearTimeout(draftFlushRef.current);
    draftFlushRef.current = window.setTimeout(() => {
      const c = loadContest();
      if (!c?.contestId) return;
      const next = {
        ...c,
        drafts: {
          ...(c.drafts || {}),
          [questionId]: {
            ...((c.drafts || {})[questionId] || {}),
            [language]: codeRef.current,
          },
        },
      };
      saveContest(next);
      setContest(next);
    }, 350);

    return () => {
      if (draftFlushRef.current) window.clearTimeout(draftFlushRef.current);
    };
  }, [code, language, mode, questionId, contest?.contestId]);

  useEffect(() => {
    if (!initialized || !expiresAt) return;
    timeoutHandledRef.current = false;

    const tick = () => {
      const diff = Math.floor((expiresAt - Date.now()) / 1000);
      setTimeLeftSeconds(diff);
      if (diff <= 0 && !timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        setModal({
          open: true,
          title: "Time's up",
          message: 'The timer has ended. Submitting your current solution now.',
        });
        handleSubmit(true, codeRef.current, languageRef.current);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, initialized]);

  const handleStartAssessment = async () => {
    const ok = await initializeAssessment();
    setInitialized(true);
    if (!ok) {
      setModal({
        open: true,
        title: 'Fullscreen Required',
        message:
          'Fullscreen mode could not be enabled. You can continue, but real OAs typically require fullscreen.',
      });
    }
  };

  const handleRun = async () => {
    if (!sessionId) return;
    setRunning(true);
    setError('');
    try {
      const { data } = await assessmentApi.run(sessionId, code, language);
      setConsoleOutput(data.data.consoleOutput);
      setTestResults(data.data.testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (
    isAutoSubmit = false,
    overrideCode = null,
    overrideLanguage = null
  ) => {
    if (!sessionId) return;
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await logEvent(isAutoSubmit ? 'assessment_auto_submit' : 'assessment_submit');
      const { data } = await assessmentApi.submit(
        sessionId,
        overrideCode ?? codeRef.current,
        overrideLanguage ?? languageRef.current
      );

      if (mode === 'contest') {
        const c = loadContest();
        if (!c?.contestId) {
          setModal({
            open: true,
            title: 'Saved',
            message:
              'Submission saved, but contest state is missing. Start a new contest to see results.',
          });
          return;
        }

        const submissionId = data.data.submissionId;
        const next = {
          ...c,
          submissions: {
            ...(c.submissions || {}),
            [questionId]: submissionId,
          },
        };
        saveContest(next);
        setContest(next);

        const allDone = (next.questionIds || []).every((id) => Boolean(next.submissions?.[id]));
        if (allDone) {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          navigate('/contest/results');
          return;
        }

        setModal({
          open: true,
          title: 'Submitted',
          message:
            'Answer saved. You can move between questions freely. Verdicts will show after the full contest is submitted.',
        });
        return;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/results/${data.data.submissionId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Loader message="Preparing assessment..." />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          {error}
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <QuestionCard
          question={question}
          onStart={handleStartAssessment}
          startLabel="Start OA Assessment"
        />
        <Modal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal({ open: false, title: '', message: '' })}
        />
      </div>
    );
  }

  const drawerTitle = drawer === 'video' ? 'Video Preview' : 'Compliance';
  const visibleTags = filterTags(question.tags);
  const contestSubmitted = mode === 'contest' ? Boolean(contest?.submissions?.[questionId]) : false;
  const timerVariant =
    timeLeftSeconds !== null && timeLeftSeconds <= 5 * 60
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : 'border-stone-700/70 bg-stone-900/60 text-stone-200';
  const submissionHint =
    question.executionMode === 'stdin'
      ? 'Submit by printing the final output (stdout). Read input from stdin exactly as described.'
      : 'Submit by returning the answer from the provided function/class. Printing is only for debug and may fail hidden tests.';

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-3 sm:px-4">
      <div
        ref={layoutRef}
        className="flex min-h-screen overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/40"
      >
        <aside
          className="flex shrink-0 flex-col border-r border-stone-800 bg-stone-950/70"
          style={{ width: sidebarWidth }}
        >
          <div className="border-b border-stone-800 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg font-semibold leading-snug text-stone-100">
                {question.title}
              </h1>
              <span className="rounded-full border border-stone-700 bg-stone-900/70 px-3 py-1 text-xs font-semibold text-stone-300">
                Difficulty hidden
              </span>
            </div>
            {question.externalUrl && (
              <a
                href={question.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-brand-100 hover:text-brand-50"
              >
                Open source page
              </a>
            )}
            {visibleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleTags.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-stone-800 bg-stone-900/40 px-2 py-1 text-[11px] text-stone-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Problem
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-200">
                {question.description}
              </p>
            </section>

            {question.constraints && (
              <section className="mt-6 space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Constraints
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-200">
                  {question.constraints}
                </p>
              </section>
            )}

            {question.examples?.length > 0 && (
              <section className="mt-6 space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Examples
                </h2>
                <div className="space-y-3">
                  {question.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-stone-800 bg-stone-950/40 p-3"
                    >
                      <p className="text-xs font-semibold text-stone-300">Example {idx + 1}</p>
                      <div className="mt-2 space-y-2 text-xs text-stone-300">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-stone-500">
                            Input
                          </p>
                          <pre className="mt-1 overflow-auto rounded-lg bg-black/30 p-2 text-xs text-stone-200">
                            {ex.input}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-stone-500">
                            Output
                          </p>
                          <pre className="mt-1 overflow-auto rounded-lg bg-black/30 p-2 text-xs text-stone-200">
                            {ex.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>

        <div
          id="oa-sidebar-divider"
          className="w-1 shrink-0 cursor-col-resize bg-stone-800 hover:bg-stone-700"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 bg-stone-950/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              {mode === 'contest' && contest?.questionIds?.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-stone-900/40 p-1">
                  {contest.questionIds.map((id, idx) => {
                    const active = id === questionId;
                    const done = Boolean(contest?.submissions?.[id]);
                    const base =
                      active
                        ? 'bg-brand-600/20 text-brand-100'
                        : 'text-stone-200 hover:bg-stone-800';
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => navigate(`/assessment/${id}?mode=contest`)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${base}`}
                        title={done ? 'Submitted' : 'Not submitted'}
                      >
                        Q{idx + 1}{done ? '•' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
              {timeLeftSeconds !== null && (
                <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${timerVariant}`}>
                  {formatClock(timeLeftSeconds)}
                </div>
              )}
              <button
                type="button"
                onClick={() => setDrawer('compliance')}
                className="rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900"
              >
                Compliance
              </button>
              <button
                type="button"
                onClick={() => setDrawer('video')}
                className="rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900"
              >
                Video
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={running || submitting || (timeLeftSeconds !== null && timeLeftSeconds <= 0)}
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-medium text-stone-100 hover:bg-stone-900 disabled:opacity-50"
              >
                {running ? 'Running...' : 'Run'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  running ||
                  submitting ||
                  contestSubmitted ||
                  (timeLeftSeconds !== null && timeLeftSeconds <= 0)
                }
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {contestSubmitted ? 'Submitted' : submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-4">
              <div className="mb-3 rounded-xl border border-stone-800 bg-stone-950/40 p-3 text-sm text-stone-300">
                <span className="font-semibold text-stone-200">How to submit: </span>
                {submissionHint}
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                height="520px"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-4">
                <h3 className="mb-3 text-sm font-semibold text-stone-100">Console Output</h3>
                <pre className="min-h-[160px] overflow-auto rounded-xl bg-black/30 p-4 text-xs text-stone-200">
                  {consoleOutput || 'Run your code to see output...'}
                </pre>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-4">
                <h3 className="mb-3 text-sm font-semibold text-stone-100">Test Results</h3>
                {testResults.length === 0 ? (
                  <p className="text-sm text-stone-500">No results yet.</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-sm ${
                          result.passed
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-rose-500/30 bg-rose-500/10'
                        }`}
                      >
                        <p className="font-medium">
                          Test {result.testCaseIndex + 1}: {result.passed ? 'Passed' : 'Failed'} (
                          {result.verdict})
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <ResultBlock label="Input" value={result.input} />
                          <ResultBlock label="Expected" value={result.expectedOutput} />
                          <ResultBlock label="Got" value={result.actualOutput} />
                        </div>
                        {result.stderr && (
                          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-500/25 bg-rose-950/30 p-3 text-xs text-rose-100">
                            {result.stderr}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <SideDrawer open={Boolean(drawer)} title={drawerTitle} onClose={() => setDrawer(null)}>
        {drawer === 'video' ? (
          <CameraPreview />
        ) : (
          <CompliancePanel compliance={compliance} />
        )}
      </SideDrawer>

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ open: false, title: '', message: '' })}
      />
    </div>
  );
}

function ResultBlock({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <pre className="mt-1 min-h-10 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-xs text-stone-200">
        {value ?? ''}
      </pre>
    </div>
  );
}
