import axios from 'axios';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildQuestionFromLeetCode } from '../utils/leetcodeTransformer.js';

const alfaApi = axios.create({
  baseURL: env.leetcode.apiUrl,
  timeout: 20000,
});

const leetcodeGraphql = axios.create({
  baseURL: 'https://leetcode.com/graphql',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const questionCache = new Map();

async function fetchGraphqlQuestion(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        content
        exampleTestcases
        metaData
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
  `;

  const { data } = await leetcodeGraphql.post('/', {
    query,
    variables: { titleSlug },
  });

  if (!data?.data?.question) {
    throw new AppError(`LeetCode question not found: ${titleSlug}`, 404);
  }

  return data.data.question;
}

async function fetchAlfaQuestion(titleSlug) {
  const { data } = await alfaApi.get('/select', { params: { titleSlug } });
  return data;
}

export async function fetchQuestionBySlug(titleSlug) {
  if (questionCache.has(titleSlug)) {
    return questionCache.get(titleSlug);
  }

  const [graphqlQuestion, alfaQuestion] = await Promise.all([
    fetchGraphqlQuestion(titleSlug),
    fetchAlfaQuestion(titleSlug).catch(() => null),
  ]);

  if (graphqlQuestion?.isPaidOnly || alfaQuestion?.isPaidOnly) {
    throw new AppError('This question is LeetCode Premium only', 403);
  }

  const question = buildQuestionFromLeetCode(graphqlQuestion, alfaQuestion);

  if (!question.isExecutable) {
    throw new AppError(
      `Question "${question.title}" uses unsupported types for code execution. Try another question.`,
      422
    );
  }

  questionCache.set(titleSlug, question);
  return question;
}

export async function fetchRandomQuestion() {
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  let lastFetchError;

  for (let listAttempt = 0; listAttempt < 6; listAttempt += 1) {
    const skip = Math.floor(Math.random() * 1800);
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    try {
      const { data } = await alfaApi.get('/problems', {
        params: { limit: 40, skip, difficulty },
      });

      const candidates = (data.problemsetQuestionList || []).filter(
        (p) => !p.isPaidOnly && p.titleSlug
      );

      if (candidates.length === 0) {
        continue;
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        try {
          return await fetchQuestionBySlug(pick.titleSlug);
        } catch (error) {
          if (error.statusCode === 422) continue;
          throw error;
        }
      }
    } catch (error) {
      lastFetchError = error;
    }
  }

  if (lastFetchError) {
    throw lastFetchError;
  }

  throw new AppError('No questions returned from LeetCode API', 502);
}

export async function fetchDailyQuestion() {
  const { data } = await alfaApi.get('/daily');

  if (data.isPaidOnly) {
    throw new AppError('Daily challenge is LeetCode Premium only today', 403);
  }

  return fetchQuestionBySlug(data.titleSlug);
}
