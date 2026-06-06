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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-100">Random Question</h1>
          <p className="mt-1 text-stone-400">A randomly selected coding problem for practice.</p>
        </div>
        <button
          type="button"
          onClick={fetchQuestion}
          disabled={loading}
          className="rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-800 disabled:opacity-50"
        >
          New Random
        </button>
      </div>

      {loading && <Loader message="Fetching question..." />}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}
      {!loading && !error && question && (
        <QuestionCard question={question} onStart={handleStart} />
      )}
    </div>
  );
}
