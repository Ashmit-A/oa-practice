export const VERDICTS = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  INTERNAL_ERROR: 'Internal Error',
};

const JUDGE0_STATUS = {
  1: 'In Queue',
  2: 'Processing',
  3: VERDICTS.ACCEPTED,
  4: VERDICTS.WRONG_ANSWER,
  5: VERDICTS.TIME_LIMIT_EXCEEDED,
  6: VERDICTS.COMPILATION_ERROR,
  7: 'Internal Error',
  8: 'Exec Format Error',
  9: 'Memory Limit Exceeded',
  10: 'Output Limit Exceeded',
  11: 'Idleness Limit Exceeded',
  12: 'Security Violation',
  13: 'Directory Creation Error',
  14: 'Internal Error',
  15: 'Internal Error',
};

export function mapJudge0Status(statusId, statusDescription) {
  if (statusId === 3) return VERDICTS.ACCEPTED;
  if (statusId === 4) return VERDICTS.WRONG_ANSWER;
  if (statusId === 5) return VERDICTS.TIME_LIMIT_EXCEEDED;
  if (statusId === 6) return VERDICTS.COMPILATION_ERROR;
  if (statusId >= 7) {
    if (statusDescription?.toLowerCase().includes('runtime')) {
      return VERDICTS.RUNTIME_ERROR;
    }
    return VERDICTS.RUNTIME_ERROR;
  }
  return statusDescription || JUDGE0_STATUS[statusId] || VERDICTS.INTERNAL_ERROR;
}

export function normalizeOutput(output) {
  if (output == null) return '';
  return String(output).trim().replace(/\r\n/g, '\n');
}

export function outputsMatch(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
