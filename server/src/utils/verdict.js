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

function sanitizeForStrictComparison(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function evaluateUserSubmission(userStdout, expectedOutput) {
  const actual = sanitizeForStrictComparison(userStdout);
  const expected = sanitizeForStrictComparison(expectedOutput);
  const passed = actual === expected;

  return {
    passed,
    actual,
    expected,
    status: passed ? VERDICTS.ACCEPTED : VERDICTS.WRONG_ANSWER,
  };
}

function parseStructuredOutput(value) {
  const raw = normalizeOutput(value);
  if (!raw) return raw;

  const normalized = raw
    .replace(/\bN\b/g, 'null')
    .replace(/\bNone\b/g, 'null')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/'/g, '"');
  try {
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

function parseStructuredCandidate(value) {
  const raw = normalizeOutput(value);
  const parsed = parseStructuredOutput(raw);
  if (parsed !== null) return parsed;

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!/^[\[{(]/.test(line)) continue;
    const lineParsed = parseStructuredOutput(line);
    if (lineParsed !== null) return lineParsed;
  }

  return null;
}

function flattenStructured(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenStructured(item));
  }
  return [value == null ? 'null' : String(value)];
}

function isFlatArray(value) {
  return Array.isArray(value) && value.every((item) => !Array.isArray(item));
}

function canonicalFlatArray(value) {
  return value
    .map((item) => (item == null ? 'null' : String(item)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .join(' ');
}

function canonicalize(value) {
  const raw = normalizeOutput(value);
  const structured = parseStructuredCandidate(raw);
  if (structured !== null) {
    return flattenStructured(structured).join(' ');
  }

  const lower = raw.toLowerCase();
  if (lower === 'true' || lower === 'false') return lower;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return String(Number(raw));

  return raw
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

export function outputsMatch(actual, expected) {
  const actualStructured = parseStructuredCandidate(actual);
  const expectedStructured = parseStructuredCandidate(expected);

  if (isFlatArray(actualStructured) && isFlatArray(expectedStructured)) {
    return canonicalFlatArray(actualStructured) === canonicalFlatArray(expectedStructured);
  }

  return canonicalize(actual) === canonicalize(expected);
}
