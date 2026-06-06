import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import RandomQuestionPage from './pages/RandomQuestionPage';
import DailyChallengePage from './pages/DailyChallengePage';
import ContestPage from './pages/ContestPage';
import ContestResultsPage from './pages/ContestResultsPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/assessment/');

  return (
    <div className="flex min-h-screen flex-col">
      {!hideChrome && <Navbar />}
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/random" element={<RandomQuestionPage />} />
            <Route path="/daily" element={<DailyChallengePage />} />
            <Route path="/contest" element={<ContestPage />} />
            <Route path="/contest/results" element={<ContestResultsPage />} />
            <Route path="/assessment/:questionId" element={<AssessmentPage />} />
            <Route path="/results/:submissionId" element={<ResultsPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}
