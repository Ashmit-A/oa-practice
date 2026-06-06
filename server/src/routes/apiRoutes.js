import { Router } from 'express';
import {
  getRandomQuestion,
  getDailyQuestion,
  getQuestionById,
  startAssessment,
  runCode,
  submitSolution,
  getSubmissionResult,
  logMonitoringEvent,
} from '../controllers/apiController.js';

const router = Router();

router.get('/questions/random', getRandomQuestion);
router.get('/questions/daily', getDailyQuestion);
router.get('/questions/:id', getQuestionById);

router.post('/assessment/start', startAssessment);
router.post('/assessment/run', runCode);
router.post('/assessment/submit', submitSolution);
router.get('/assessment/result/:id', getSubmissionResult);

router.post('/monitoring/event', logMonitoringEvent);

export default router;
