import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';
import { generateHiddenTestCases } from './aiEvaluationService.js';
import logger from '../utils/logger.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash-8b';
const GFG_PARSER_META = {
  parser: 'gemini',
  parserVersion: 2,
  parserModel: GEMINI_PRIMARY_MODEL,
  parserFallbackModel: GEMINI_FALLBACK_MODEL,
};

const practiceApi = axios.create({
  baseURL: 'https://practiceapi.geeksforgeeks.org',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'oa-practice/1.0',
  },
});

const listCache = {
  expiresAt: 0,
  pages: new Map(),
};

function mapDifficulty(raw) {
  const normalized = String(raw || '').toLowerCase();
  if (normalized === 'basic' || normalized === 'easy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeParsedProblem(parsed) {
  const examples = Array.isArray(parsed?.examples)
    ? parsed.examples
        .map((example) => ({
          input: normalizeString(example?.input),
          output: normalizeString(example?.output),
          explanation: '',
        }))
        .filter((example) => example.input && example.output)
    : [];

  return {
    description: normalizeString(parsed?.description),
    constraints: normalizeString(parsed?.constraints),
    examples,
  };
}

function extractGeminiText(response) {
  if (typeof response?.text === 'string') return response.text;
  if (typeof response?.text === 'function') return response.text();

  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('');
}

function parseGeminiJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) return JSON.parse(fenced[1]);
    throw new Error('Gemini returned invalid JSON');
  }
}

function buildGfgParsePrompt(problemQuestionHtml) {
  return `Process this raw GeeksforGeeks problem HTML and return exclusively a strictly valid JSON object.

Return exactly this schema and no extra text:
{
  "description": "Clean string of the problem description, preserving standard mathematical expressions or variables, dropping everything starting from the Examples section",
  "constraints": "Clean string containing only the problem constraints text",
  "examples": [
    {
      "input": "Cleaned input parameters flattened into clean space-separated or newline-separated values appropriate for standard STDIN streams",
      "output": "Cleaned output string stripped of trailing explanations, typos like 'Explaination:', or administrative task text",
      "explanation": ""
    }
  ]
}

Rules:
- Read the raw HTML directly; do not preserve HTML tags.
- Keep only the problem statement in description. Stop before Examples, Input/Output sample blocks, Your Task, Expected Complexity, and Constraints.
- Put only constraints text in constraints.
- For examples, remove labels such as "arr =", "grid[][] =", "n =", "Input:" and "Output:".
- Flatten arrays and matrices into normal stdin text. Example: [[1, 2], [3, 4]] becomes "1 2\\n3 4"; [1, 2, 3] becomes "1 2 3".
- If multiple input parameters exist, put each cleaned parameter on its own line.
- Output must not include explanation text, misspelled labels such as Explaination/Explantion/Explantions, "Your Task", or complexity notes.
- Preserve output structures when they are the expected answer, but remove trailing explanation/admin text.
- Always set example.explanation to an empty string.

HTML:
${problemQuestionHtml}`;
}

async function generateGfgParseJson(problemQuestionHtml, model) {
  const response = await ai.models.generateContent({
    model,
    contents: buildGfgParsePrompt(problemQuestionHtml),
    config: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  return parseGeminiJson(extractGeminiText(response));
}

async function parseGfgProblemHtml(problemQuestionHtml) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY not set, skipping GeeksforGeeks problem parsing');
    return {
      description: '',
      constraints: '',
      examples: [],
    };
  }

  try {
    return normalizeParsedProblem(
      await generateGfgParseJson(problemQuestionHtml, GEMINI_PRIMARY_MODEL)
    );
  } catch (primaryError) {
    if (primaryError instanceof AppError) throw primaryError;
    logger.warn('gfg_parse_primary_gemini_failed', {
      model: GEMINI_PRIMARY_MODEL,
      fallbackModel: GEMINI_FALLBACK_MODEL,
      message: primaryError.message,
    });

    try {
      return normalizeParsedProblem(
        await generateGfgParseJson(problemQuestionHtml, GEMINI_FALLBACK_MODEL)
      );
    } catch (fallbackError) {
      logger.warn('gfg_parse_fallback_gemini_failed', {
        model: GEMINI_FALLBACK_MODEL,
        message: fallbackError.message,
      });
      throw new AppError(
        'High system traffic is preventing QUESTION parsing. Please try again shortly.',
        503
      );
    }
  }
}

async function parseExamples(problemQuestionHtml) {
  const parsed = await parseGfgProblemHtml(problemQuestionHtml);
  return parsed.examples;
}

async function extractConstraints(problemQuestionHtml) {
  const parsed = await parseGfgProblemHtml(problemQuestionHtml);
  return parsed.constraints;
}

async function extractDescription(problemQuestionHtml) {
  const parsed = await parseGfgProblemHtml(problemQuestionHtml);
  return parsed.description;
}

function buildStdinStarterCode() {
  return {
    python: `import sys

def solve(data):
    pass

if __name__ == "__main__":
    data = sys.stdin.read()
    solve(data)
`,
    javascript: `const fs = require('fs');

function solve(input) {
}

const input = fs.readFileSync(0, 'utf8');
const out = solve(input);
if (out !== undefined) {
  process.stdout.write(typeof out === 'string' ? out : JSON.stringify(out));
}
`,
    java: `import java.io.*;

public class Main {
    static void solve(String input) throws Exception {
    }

    public static void main(String[] args) throws Exception {
        String input = new String(System.in.readAllBytes());
        solve(input);
    }
}
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

void solve(const string& input) {
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    solve(input);
    return 0;
}
`,
  };
}

function hashToIndex(text, mod) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % mod;
}

async function fetchProblemsPage(page, sortBy = 'submissions') {
  const cacheKey = `${page}:${sortBy}`;
  const cached = listCache.pages.get(cacheKey);
  if (cached && Date.now() < listCache.expiresAt) return cached;

  const { data } = await practiceApi.get('/api/vr/problems/', {
    params: { pageMode: 'explore', page, sortBy },
  });

  const results = data?.results || [];
  if (!Array.isArray(results) || results.length === 0) {
    throw new AppError('No problems returned from GeeksforGeeks', 502);
  }

  listCache.expiresAt = Date.now() + 30 * 60 * 1000;
  listCache.pages.set(cacheKey, results);
  return results;
}

async function fetchProblemDetails(slug) {
  const { data } = await practiceApi.get(`/api/latest/problems/${slug}/`);
  const results = data?.results;
  if (!results?.slug || !results?.problem_name) {
    throw new AppError(`GeeksforGeeks problem not found: ${slug}`, 404);
  }
  return results;
}

async function buildQuestionFromGfgProblem(problem) {
  const slug = problem.slug;
  const questionId = `gfg_${slug}`;
  const externalUrl = problem.problem_url || `https://www.geeksforgeeks.org/problems/${slug}/1`;
  const parsed = await parseGfgProblemHtml(problem.problem_question);

  const sampleCases = parsed.examples.map((ex) => ({
    input: ex.input,
    expectedOutput: ex.output,
    isSample: true,
    isHidden: false,
  }));
  const hiddenCases = await generateHiddenTestCases({
    title: problem.problem_name,
    description: parsed.description,
    constraints: parsed.constraints,
    examples: parsed.examples,
  });
  const testCases = [...sampleCases, ...hiddenCases];

  return {
    id: questionId,
    titleSlug: questionId,
    title: normalizeString(problem.problem_name),
    description: parsed.description,
    constraints: parsed.constraints,
    examples: parsed.examples,
    difficulty: mapDifficulty(problem.difficulty || problem.problem_level_text),
    tags: (problem.tags?.topic_tags || []).filter(Boolean),
    starterCode: buildStdinStarterCode(),
    sampleTestCases: testCases.filter((tc) => tc.isSample),
    testCases,
    metaData: GFG_PARSER_META,
    isExecutable: testCases.length > 0,
    timeLimitSeconds: 5,
    memoryLimitKb: 128000,
    executionMode: 'stdin',
    source: 'gfg',
    externalUrl,
  };
}

export async function fetchRandomGfgQuestion() {
  const page = Math.floor(Math.random() * 30) + 1;
  const list = await fetchProblemsPage(page);
  const pick = list[Math.floor(Math.random() * list.length)];
  const details = await fetchProblemDetails(pick.slug);
  return buildQuestionFromGfgProblem({ ...details, problem_url: pick.problem_url });
}

export async function fetchDailyGfgQuestion() {
  const list = await fetchProblemsPage(1);
  const today = new Date().toISOString().slice(0, 10);
  const pick = list[hashToIndex(today, list.length)];
  const details = await fetchProblemDetails(pick.slug);
  return buildQuestionFromGfgProblem({ ...details, problem_url: pick.problem_url });
}

export async function fetchGfgQuestionById(id) {
  const slug = String(id || '').replace(/^gfg_/, '');
  if (!slug) {
    throw new AppError('Invalid GeeksforGeeks question id', 400);
  }
  const details = await fetchProblemDetails(slug);
  return buildQuestionFromGfgProblem(details);
}

export const gfgParser = {
  parseExamples,
  extractConstraints,
  extractDescription,
};
