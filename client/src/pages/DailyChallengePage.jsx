import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/client';
import QuestionCard from '../components/QuestionCard';
import Loader from '../components/Loader';

export default function DailyChallengePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const { data } = await questionsApi.getDaily();
        setQuestion(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-brand-500">{today}</p>
        <h1 className="text-3xl font-bold text-stone-100">Daily Contest</h1>
        <p className="mt-1 text-stone-400">Race the clock for points — faster accepted runs score higher.</p>
      </div>

      {loading && <Loader message="Loading daily challenge..." />}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}
      {!loading && !error && question && (
        <QuestionCard
          question={question}
          onStart={() => navigate(`/assessment/${question.id}?mode=daily`)}
          startLabel="Start Daily Contest"
        />
      )}
    </div>
  );
}
