import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';
import { normalizeOutput } from '../utils/verdict.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function extractText(response) {
  if (typeof response?.text === 'string') return response.text;
  if (typeof response?.text === 'function') return response.text();
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('');
}

function parseJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) return JSON.parse(fenced[1]);
    throw new Error('Model returned invalid JSON');
  }
}

async function generateJson(prompt) {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  return parseJson(extractText(response));
}

function normalizeHiddenCases(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((testCase) => ({
      input: normalizeOutput(testCase?.input),
      expectedOutput: normalizeOutput(testCase?.expectedOutput),
      isSample: false,
      isHidden: true,
    }))
    .filter((testCase) => testCase.input && testCase.expectedOutput);
}

export async function generateHiddenTestCases({ title, description, constraints, examples }) {
  if (!hasGeminiKey()) return [];

  try {
    const parsed = await generateJson(`Create hidden judge test cases for this competitive programming problem.

Return strictly valid JSON with this schema:
{
  "hiddenTestCases": [
    {
      "input": "STDIN-ready input only. No labels. No explanation.",
      "expectedOutput": "Expected stdout only. No explanation."
    }
  ]
}

Requirements:
- Generate 5 hidden tests unless the problem has fewer meaningful edge cases.
- Include edge cases, small cases, duplicates, sorted/reverse data, and boundary-style cases when relevant.
- Inputs must match the same STDIN format as the public examples.
- Expected outputs must be correct and deterministic.
- Do not include explanations, markdown, labels, or code.
- Avoid huge inputs; keep tests practical for a public web judge.

Problem title:
${title}

Description:
${description}

Constraints:
${constraints}

Public examples:
${JSON.stringify(examples || [], null, 2)}`);

    return normalizeHiddenCases(parsed?.hiddenTestCases);
  } catch (error) {
    logger.warn('ai_hidden_tests_failed', { message: error.message, title });
    return [];
  }
}
