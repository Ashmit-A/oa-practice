import { v4 as uuidv4 } from 'uuid';
import AssessmentSession from '../models/AssessmentSession.js';
import Submission from '../models/Submission.js';
import MonitoringEvent from '../models/MonitoringEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQuestionWithAllTestCases } from './questionService.js';
import { executeCode, runTestCases } from './judge0Service.js';
import { isValidLanguage } from '../utils/languageMap.js';
import { VERDICTS, normalizeOutput } from '../utils/verdict.js';
import { wrapUserCode } from '../utils/codeRunner.js';

const MODE_DURATIONS_SECONDS = {
  random: 40 * 60,
  daily: 40 * 60,
  contest: 30 * 60,
};

function computeScore({ verdict, timeTakenSeconds, durationSeconds, timedOut }) {
  if (timedOut) return 0;
  if (verdict !== VERDICTS.ACCEPTED) return 0;
  const ratio = Math.min(1, Math.max(0, timeTakenSeconds / Math.max(1, durationSeconds)));
  return Math.max(0, Math.round(1000 * (1 - ratio)));
}

export async function startAssessment({ questionId, mode = 'random' }) {
  const question = await getQuestionWithAllTestCases(questionId);
  const sessionId = uuidv4();
  const durationSeconds = MODE_DURATIONS_SECONDS[mode] ?? MODE_DURATIONS_SECONDS.random;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationSeconds * 1000);

  const session = await AssessmentSession.create({
    sessionId,
    questionSlug: question.titleSlug,
    mode,
    status: 'active',
    startedAt: now,
    durationSeconds,
    expiresAt,
  });

  return {
    sessionId: session.sessionId,
    questionId: question.id,
    mode: session.mode,
    startedAt: session.startedAt,
    durationSeconds: session.durationSeconds,
    expiresAt: session.expiresAt,
  };
}

function prepareExecutableCode(sourceCode, language, question) {
  try {
    if (question.executionMode === 'stdin') {
      return sourceCode;
    }
    return wrapUserCode(sourceCode, language, question.metaData);
  } catch (error) {
    throw new AppError(`Failed to prepare code for execution: ${error.message}`, 400);
  }
}

export async function runCode({ sessionId, sourceCode, language }) {
  if (!isValidLanguage(language)) {
    throw new AppError('Invalid programming language', 400);
  }

  const session = await AssessmentSession.findOne({ sessionId });
  if (!session) {
    throw new AppError('Assessment session not found', 404);
  }

  if (session.expiresAt && Date.now() > new Date(session.expiresAt).getTime()) {
    session.status = 'expired';
    await session.save();
    throw new AppError('Time is up for this assessment session', 403);
  }

  const question = await getQuestionWithAllTestCases(session.questionSlug);
  const sampleCases = question.testCases.filter((tc) => tc.isSample);

  if (sampleCases.length === 0) {
    throw new AppError('No sample test cases available', 400);
  }

  const executableCode = prepareExecutableCode(sourceCode, language, question);
  const results = [];
  let consoleOutput = '';

  for (let i = 0; i < sampleCases.length; i += 1) {
    const testCase = sampleCases[i];
    const execution = await executeCode({
      sourceCode: executableCode,
      language,
      stdin: testCase.input,
      timeLimitSeconds: question.timeLimitSeconds,
      memoryLimitKb: question.memoryLimitKb,
    });

    const actual = normalizeOutput(execution.stdout);
    const expected = normalizeOutput(testCase.expectedOutput);
    const passed =
      execution.verdict === VERDICTS.ACCEPTED && actual === expected;

    results.push({
      testCaseIndex: i,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: actual,
      stderr: execution.stderr,
      verdict: passed ? VERDICTS.ACCEPTED : execution.verdict === VERDICTS.ACCEPTED ? VERDICTS.WRONG_ANSWER : execution.verdict,
      passed,
      runtimeMs: execution.runtimeMs,
      memoryKb: execution.memoryKb,
    });

    consoleOutput += `[Test ${i + 1}] ${passed ? 'Passed' : results[i].verdict}\n`;
    if (execution.stdout) consoleOutput += `Output: ${actual}\n`;
    if (testCase.expectedOutput) consoleOutput += `Expected: ${expected}\n`;
    if (execution.stderr) consoleOutput += `Error: ${execution.stderr.trim()}\n`;
    consoleOutput += '\n';
  }

  return { consoleOutput: consoleOutput.trim(), testResults: results };
}

export async function submitSolution({ sessionId, sourceCode, language }) {
  if (!isValidLanguage(language)) {
    throw new AppError('Invalid programming language', 400);
  }

  const session = await AssessmentSession.findOne({ sessionId });
  if (!session) {
    throw new AppError('Assessment session not found', 404);
  }

  if (session.status === 'submitted') {
    throw new AppError('Assessment already submitted', 400);
  }

  const now = new Date();
  const expiresAtMs = session.expiresAt ? new Date(session.expiresAt).getTime() : null;
  const timedOut = expiresAtMs ? now.getTime() > expiresAtMs : false;
  const durationSeconds = session.durationSeconds || MODE_DURATIONS_SECONDS[session.mode] || MODE_DURATIONS_SECONDS.random;
  const startedAtMs = session.startedAt ? new Date(session.startedAt).getTime() : now.getTime();
  const timeTakenSeconds = Math.min(
    durationSeconds,
    Math.max(0, Math.ceil((now.getTime() - startedAtMs) / 1000))
  );

  const question = await getQuestionWithAllTestCases(session.questionSlug);
  const executableCode = prepareExecutableCode(sourceCode, language, question);

  const evaluation = await runTestCases({
    sourceCode: executableCode,
    language,
    testCases: question.testCases,
    timeLimitSeconds: question.timeLimitSeconds,
    memoryLimitKb: question.memoryLimitKb,
  });

  const score = computeScore({
    verdict: evaluation.verdict,
    timeTakenSeconds,
    durationSeconds,
    timedOut,
  });

  const submission = await Submission.create({
    sessionId,
    questionSlug: question.titleSlug,
    mode: session.mode,
    language,
    sourceCode,
    verdict: evaluation.verdict,
    passedTestCases: evaluation.passedTestCases,
    totalTestCases: evaluation.totalTestCases,
    runtimeMs: evaluation.runtimeMs,
    memoryKb: evaluation.memoryKb,
    testResults: evaluation.testResults,
    durationSeconds,
    timeTakenSeconds,
    score,
    timedOut,
  });

  session.status = timedOut ? 'expired' : 'submitted';
  session.submittedAt = now;
  await session.save();

  return {
    submissionId: submission._id.toString(),
    sessionId,
    verdict: submission.verdict,
    passedTestCases: submission.passedTestCases,
    totalTestCases: submission.totalTestCases,
    runtimeMs: submission.runtimeMs,
    memoryKb: submission.memoryKb,
    testResults: submission.testResults,
    submittedAt: submission.submittedAt,
    durationSeconds: submission.durationSeconds,
    timeTakenSeconds: submission.timeTakenSeconds,
    score: submission.score,
    timedOut: submission.timedOut,
    mode: submission.mode,
  };
}

export async function getSubmissionResult(submissionId) {
  const submission = await Submission.findById(submissionId).lean();
  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  const session = await AssessmentSession.findOne({ sessionId: submission.sessionId }).lean();
  const monitoringEvents = await MonitoringEvent.find({ sessionId: submission.sessionId })
    .sort({ timestamp: 1 })
    .lean();

  const monitoringSummary = buildMonitoringSummary(monitoringEvents);

  return {
    submissionId: submission._id.toString(),
    sessionId: submission.sessionId,
    questionId: submission.questionSlug,
    mode: submission.mode,
    verdict: submission.verdict,
    passedTestCases: submission.passedTestCases,
    totalTestCases: submission.totalTestCases,
    runtimeMs: submission.runtimeMs,
    memoryKb: submission.memoryKb,
    testResults: submission.testResults,
    submittedAt: submission.submittedAt,
    startedAt: session?.startedAt,
    durationSeconds: submission.durationSeconds,
    timeTakenSeconds: submission.timeTakenSeconds,
    score: submission.score,
    timedOut: submission.timedOut,
    monitoringSummary,
    monitoringEvents: monitoringEvents.map((e) => ({
      eventType: e.eventType,
      metadata: e.metadata,
      timestamp: e.timestamp,
    })),
  };
}

function buildMonitoringSummary(events) {
  const summary = {
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    windowBlurCount: 0,
    visibilityHiddenCount: 0,
    cameraStatus: 'unknown',
    microphoneStatus: 'unknown',
    displayDetection: 'unknown',
    totalEvents: events.length,
  };

  for (const event of events) {
    switch (event.eventType) {
      case 'tab_switch':
      case 'visibility_hidden':
        summary.tabSwitchCount += 1;
        if (event.eventType === 'visibility_hidden') {
          summary.visibilityHiddenCount += 1;
        }
        break;
      case 'fullscreen_exit':
        summary.fullscreenExitCount += 1;
        break;
      case 'window_blur':
        summary.windowBlurCount += 1;
        break;
      case 'camera_granted':
        summary.cameraStatus = 'granted';
        break;
      case 'camera_denied':
        summary.cameraStatus = 'denied';
        break;
      case 'microphone_granted':
        summary.microphoneStatus = 'granted';
        break;
      case 'microphone_denied':
        summary.microphoneStatus = 'denied';
        break;
      case 'multi_monitor_check':
        summary.displayDetection = event.metadata?.result || 'unknown';
        break;
      default:
        break;
    }
  }

  return summary;
}
