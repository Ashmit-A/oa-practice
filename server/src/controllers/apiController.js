import * as questionService from '../services/questionService.js';
import * as assessmentService from '../services/assessmentService.js';
import * as monitoringService from '../services/monitoringService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getRandomQuestion = asyncHandler(async (_req, res) => {
  const question = await questionService.getRandomQuestion();
  res.json({ success: true, data: question });
});

export const getDailyQuestion = asyncHandler(async (_req, res) => {
  const question = await questionService.getDailyQuestion();
  res.json({ success: true, data: question });
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestionById(req.params.id);
  res.json({ success: true, data: question });
});

export const startAssessment = asyncHandler(async (req, res) => {
  const { questionId, mode } = req.body;
  if (!questionId) {
    return res.status(400).json({ success: false, message: 'questionId is required' });
  }
  const session = await assessmentService.startAssessment({ questionId, mode });
  res.status(201).json({ success: true, data: session });
});

export const runCode = asyncHandler(async (req, res) => {
  const { sessionId, sourceCode, language } = req.body;
  if (!sessionId || !sourceCode || !language) {
    return res.status(400).json({
      success: false,
      message: 'sessionId, sourceCode, and language are required',
    });
  }
  const result = await assessmentService.runCode({ sessionId, sourceCode, language });
  res.json({ success: true, data: result });
});

export const submitSolution = asyncHandler(async (req, res) => {
  const { sessionId, sourceCode, language } = req.body;
  if (!sessionId || !sourceCode || !language) {
    return res.status(400).json({
      success: false,
      message: 'sessionId, sourceCode, and language are required',
    });
  }
  const result = await assessmentService.submitSolution({ sessionId, sourceCode, language });
  res.json({ success: true, data: result });
});

export const getSubmissionResult = asyncHandler(async (req, res) => {
  const result = await assessmentService.getSubmissionResult(req.params.id);
  res.json({ success: true, data: result });
});

export const logMonitoringEvent = asyncHandler(async (req, res) => {
  const { sessionId, eventType, metadata } = req.body;
  const event = await monitoringService.logMonitoringEvent({ sessionId, eventType, metadata });
  res.status(201).json({ success: true, data: event });
});
