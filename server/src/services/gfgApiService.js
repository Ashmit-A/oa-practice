import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';

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

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '<=')
    .replace(/&#8804;/g, '<=')
    .replace(/&ge;/g, '>=')
    .replace(/&#8805;/g, '>=')
    .replace(/&times;/g, '*')
    .replace(/&#215;/g, '*')
    .replace(/&minus;/g, '-')
    .replace(/&#8722;/g, '-')
    .replace(/&lt;/g, '<')
    .replace(/&#60;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#62;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&');
}

function stripHtml(html) {
  const raw = String(html || '');
  const withSup = raw
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^$1')
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '_$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|pre|h1|h2|h3|h4|h5|h6)>/gi, '\n');

  const noTags = withSup.replace(/<[^>]*>/g, ' ');
  const decoded = decodeHtmlEntities(noTags);

  return decoded
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapDifficulty(raw) {
  const normalized = String(raw || '').toLowerCase();
  if (normalized === 'basic' || normalized === 'easy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

function simplifyExampleValue(value) {
  const v = String(value || '').trim();
  const unwrapped = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  return decodeHtmlEntities(unwrapped).trim();
}

export function cleanGfgExpectedOutput(output) {
  return simplifyExampleValue(output)
    .replace(/\s*(?:Explanation|Your Task|Expected Time Complexity|Expected Auxiliary Space)\s*:.*$/is, '')
    .trim();
}

function simplifyExampleInput(inputText) {
  const raw = decodeHtmlEntities(String(inputText || '')).trim();
  if (!raw) return '';

  const parts = raw.split(/\s*,\s*/);
  const rhs = parts
    .map((p) => {
      const idx = p.indexOf('=');
      if (idx === -1) return p.trim();
      return p.slice(idx + 1).trim();
    })
    .map((v) => simplifyExampleValue(v))
    .filter(Boolean);

  if (rhs.length === 0) return raw;
  return rhs.join('\n');
}

function parseExamples(problemQuestionHtml) {
  const html = String(problemQuestionHtml || '');
  const preBlocks = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)].map((m) =>
    decodeHtmlEntities(
      m[1]
        .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^$1')
        .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '_$1')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
    ).trim()
  );

  const examples = [];
  for (const block of preBlocks) {
    const inputMatch = block.match(/Input:\s*([\s\S]*?)\s*Output:/i);
    const outputMatch = block.match(
      /Output:\s*([\s\S]*?)(?:\n\s*(?:Explanation|Your Task|Expected Time Complexity|Expected Auxiliary Space)\s*:|$)/i
    );
    if (!inputMatch || !outputMatch) continue;

    const input = simplifyExampleInput(inputMatch[1]);
    const output = cleanGfgExpectedOutput(outputMatch[1]);
    if (!input || output === '') continue;
    examples.push({ input, output, explanation: '' });
  }

  return examples;
}

function extractConstraints(problemQuestionHtml) {
  const text = stripHtml(problemQuestionHtml);
  const match = text.match(/Constraints:\s*([\s\S]*)/i);
  if (!match) return '';
  return match[1].trim();
}

function extractDescription(problemQuestionHtml) {
  const text = stripHtml(problemQuestionHtml);
  const idx = text.search(/Examples:/i);
  if (idx === -1) return text;
  return text.slice(0, idx).trim();
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

function buildQuestionFromGfgProblem(problem) {
  const slug = problem.slug;
  const questionId = `gfg_${slug}`;
  const externalUrl = problem.problem_url || `https://www.geeksforgeeks.org/problems/${slug}/1`;

  const examples = parseExamples(problem.problem_question);
  const testCases = examples.map((ex, idx) => ({
    input: ex.input,
    expectedOutput: ex.output,
    isSample: true,
    isHidden: false,
  }));

  return {
    id: questionId,
    titleSlug: questionId,
    title: decodeHtmlEntities(problem.problem_name),
    description: extractDescription(problem.problem_question),
    constraints: extractConstraints(problem.problem_question),
    examples,
    difficulty: mapDifficulty(problem.difficulty || problem.problem_level_text),
    tags: (problem.tags?.topic_tags || []).filter(Boolean),
    starterCode: buildStdinStarterCode(),
    sampleTestCases: testCases.filter((tc) => tc.isSample),
    testCases,
    metaData: null,
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
