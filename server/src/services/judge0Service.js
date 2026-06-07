import axios from 'axios';
import env from '../config/env.js';
import { mapJudge0Status, evaluateUserSubmission, VERDICTS } from '../utils/verdict.js';
import { getLanguageId } from '../utils/languageMap.js';
import logger from '../utils/logger.js';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (env.judge0.apiKey) {
    headers['X-Auth-Token'] = env.judge0.apiKey;
  }
  if (env.judge0.rapidApiKey) {
    headers['X-RapidAPI-Key'] = env.judge0.rapidApiKey;
    headers['X-RapidAPI-Host'] = env.judge0.rapidApiHost;
  }
  return headers;
}

async function pollSubmission(token) {
  const url = `${env.judge0.apiUrl}/submissions/${token}?fields=*`;

  for (let attempt = 0; attempt < env.judge0.maxPollAttempts; attempt += 1) {
    const { data } = await axios.get(url, { headers: getHeaders() });

    if (data.status?.id > 2) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, env.judge0.pollIntervalMs));
  }

  throw new Error('Code execution timed out while waiting for Judge0');
}

async function submitToJudge0(sourceCode, languageId, stdin, timeLimit, memoryLimit) {
  const waitParam = env.judge0.useWait ? 'true' : 'false';
  const url = `${env.judge0.apiUrl}/submissions?base64_encoded=false&wait=${waitParam}`;
  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin || '',
    cpu_time_limit: Math.min(timeLimit || 5, 15),
    memory_limit: Math.max(memoryLimit || 128000, 16000),
  };

  const { data } = await axios.post(url, payload, { headers: getHeaders(), timeout: 60000 });

  if (env.judge0.useWait) {
    return data;
  }

  return pollSubmission(data.token);
}

export async function executeCode({ sourceCode, language, stdin, timeLimitSeconds, memoryLimitKb }) {
  const languageId = getLanguageId(language);

  try {
    const result = await submitToJudge0(
      sourceCode,
      languageId,
      stdin,
      timeLimitSeconds,
      memoryLimitKb
    );

    const verdict = mapJudge0Status(result.status?.id, result.status?.description);
    const stdout = result.stdout ?? '';
    const stderr = result.stderr ?? result.compile_output ?? result.message ?? '';

    return {
      verdict,
      stdout,
      stderr,
      runtimeMs: Math.round((parseFloat(result.time) || 0) * 1000),
      memoryKb: result.memory || 0,
      statusId: result.status?.id,
      passed: verdict === VERDICTS.ACCEPTED,
    };
  } catch (error) {
    logger.error('judge0_execute_failed', {
      language,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      message: error.message,
    });

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (error.code === 'ECONNREFUSED'
        ? 'Judge0 is unreachable. Set JUDGE0_API_URL=https://ce.judge0.com in server/.env'
        : error.message);

    return {
      verdict: VERDICTS.INTERNAL_ERROR,
      stdout: '',
      stderr: message,
      runtimeMs: 0,
      memoryKb: 0,
      passed: false,
    };
  }
}

export async function runTestCases({
  sourceCode,
  language,
  testCases,
  timeLimitSeconds,
  memoryLimitKb,
}) {
  const results = [];
  let maxRuntime = 0;
  let maxMemory = 0;
  let overallVerdict = VERDICTS.ACCEPTED;
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i += 1) {
    const testCase = testCases[i];
    const execution = await executeCode({
      sourceCode,
      language,
      stdin: testCase.input,
      timeLimitSeconds,
      memoryLimitKb,
    });

    maxRuntime = Math.max(maxRuntime, execution.runtimeMs);
    maxMemory = Math.max(maxMemory, execution.memoryKb);

    const evaluation = evaluateUserSubmission(execution.stdout, testCase.expectedOutput);
    const passed = execution.verdict === VERDICTS.ACCEPTED && evaluation.passed;

    if (passed) {
      passedCount += 1;
    } else if (overallVerdict === VERDICTS.ACCEPTED) {
      if (execution.verdict === VERDICTS.COMPILATION_ERROR) {
        overallVerdict = VERDICTS.COMPILATION_ERROR;
      } else if (execution.verdict === VERDICTS.TIME_LIMIT_EXCEEDED) {
        overallVerdict = VERDICTS.TIME_LIMIT_EXCEEDED;
      } else if (execution.verdict === VERDICTS.INTERNAL_ERROR) {
        overallVerdict = VERDICTS.INTERNAL_ERROR;
      } else if (execution.verdict === VERDICTS.RUNTIME_ERROR || execution.stderr) {
        overallVerdict = VERDICTS.RUNTIME_ERROR;
      } else {
        overallVerdict = VERDICTS.WRONG_ANSWER;
      }
    }

    results.push({
      testCaseIndex: i,
      passed,
      input: testCase.isHidden ? undefined : testCase.input,
      expectedOutput: testCase.isHidden ? undefined : testCase.expectedOutput,
      actualOutput: testCase.isHidden ? undefined : evaluation.actual,
      stderr: execution.stderr,
      verdict:
        passed
          ? VERDICTS.ACCEPTED
          : execution.verdict === VERDICTS.ACCEPTED
            ? VERDICTS.WRONG_ANSWER
            : execution.verdict,
      isHidden: testCase.isHidden,
    });

    if (
      overallVerdict === VERDICTS.COMPILATION_ERROR ||
      overallVerdict === VERDICTS.INTERNAL_ERROR
    ) {
      break;
    }
  }

  return {
    verdict: passedCount === testCases.length ? VERDICTS.ACCEPTED : overallVerdict,
    passedTestCases: passedCount,
    totalTestCases: testCases.length,
    runtimeMs: maxRuntime,
    memoryKb: maxMemory,
    testResults: results,
  };
}
