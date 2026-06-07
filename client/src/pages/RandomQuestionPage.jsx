import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/client';
import QuestionCard from '../components/QuestionCard';
import Loader from '../components/Loader';

export default function RandomQuestionPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuestion = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionsApi.getRandom();
      setQuestion(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleStart = () => {
    navigate(`/assessment/${question.id}?mode=random`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase text-brand-500">Practice mode</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">
            Random Question
          </h1>
          <p className="mt-2 text-zinc-400">A fresh coding problem with a full assessment flow.</p>
        </div>
        <button
          type="button"
          onClick={fetchQuestion}
          disabled={loading}
          className="rounded-lg border border-zinc-700 bg-zinc-900/40 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          New Random
        </button>
      </div>

      {loading && <Loader message="Fetching question..." />}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}
      {!loading && !error && question && (
        <QuestionCard question={question} onStart={handleStart} />
      )}
    </div>
  );
}
