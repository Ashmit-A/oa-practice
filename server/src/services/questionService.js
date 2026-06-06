import { AppError } from '../middleware/errorHandler.js';
import ExternalQuestion from '../models/ExternalQuestion.js';
import {
  fetchDailyQuestion,
  fetchQuestionBySlug,
  fetchRandomQuestion,
} from './leetcodeApiService.js';
import {
  cleanGfgExampleInput,
  cleanGfgExpectedOutput,
  cleanGfgText,
  fetchDailyGfgQuestion,
  fetchGfgQuestionById,
  fetchRandomGfgQuestion,
} from './gfgApiService.js';

function isGfgId(id) {
  return String(id || '').startsWith('gfg_');
}

function externalDocToQuestion(doc) {
  const normalizedTestCases = (doc.testCases || []).map((tc) => ({
    ...tc,
    input: doc.source === 'gfg' ? cleanGfgExampleInput(tc.input) : tc.input,
    expectedOutput:
      doc.source === 'gfg' ? cleanGfgExpectedOutput(tc.expectedOutput) : tc.expectedOutput,
    isSample: doc.source === 'gfg' ? true : Boolean(tc.isSample),
    isHidden: doc.source === 'gfg' ? false : Boolean(tc.isHidden),
  }));

  return {
    id: doc.slug,
    titleSlug: doc.slug,
    title: doc.source === 'gfg' ? cleanGfgText(doc.title) : doc.title,
    description: doc.source === 'gfg' ? cleanGfgText(doc.description) : doc.description,
    constraints: doc.source === 'gfg' ? cleanGfgText(doc.constraints) : doc.constraints,
    examples:
      doc.source === 'gfg'
        ? (doc.examples || []).map((ex) => ({
            ...ex,
            input: cleanGfgExampleInput(ex.input),
            output: cleanGfgExpectedOutput(ex.output),
          }))
        : doc.examples,
    difficulty: doc.difficulty,
    tags: doc.tags,
    starterCode: doc.starterCode,
    sampleTestCases: normalizedTestCases.filter((tc) => tc.isSample),
    testCases: normalizedTestCases,
    metaData: doc.metaData,
    isExecutable: normalizedTestCases.length > 0,
    timeLimitSeconds: doc.timeLimitSeconds,
    memoryLimitKb: doc.memoryLimitKb,
    executionMode: doc.executionMode,
    source: doc.source,
    externalUrl: doc.externalUrl,
  };
}

async function upsertExternalQuestion(question) {
  const normalizedTestCases = (question.testCases || []).map((tc) => ({
    ...tc,
    isHidden: Boolean(tc.isHidden),
  }));

  const payload = {
    slug: question.id,
    source: question.source,
    externalUrl: question.externalUrl,
    title: question.title,
    description: question.description,
    constraints: question.constraints,
    examples: question.examples,
    difficulty: question.difficulty,
    tags: question.tags,
    starterCode: question.starterCode,
    testCases: normalizedTestCases,
    timeLimitSeconds: question.timeLimitSeconds,
    memoryLimitKb: question.memoryLimitKb,
    executionMode: question.executionMode,
    metaData: question.metaData,
    fetchedAt: new Date(),
  };

  const doc = await ExternalQuestion.findOneAndUpdate(
    { slug: question.id },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return externalDocToQuestion(doc);
}

function formatQuestion(question) {
  return {
    id: question.id,
    titleSlug: question.titleSlug,
    title: question.title,
    description: question.description,
    constraints: question.constraints,
    examples: question.examples,
    difficulty: question.difficulty,
    tags: question.tags,
    starterCode: question.starterCode,
    sampleTestCases: question.sampleTestCases,
    timeLimitSeconds: question.timeLimitSeconds,
    memoryLimitKb: question.memoryLimitKb,
    executionMode: question.executionMode,
    source: question.source,
    externalUrl: question.externalUrl,
  };
}

export async function getRandomQuestion() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const question = await fetchRandomGfgQuestion();
    if (!question.isExecutable) continue;
    const saved = await upsertExternalQuestion(question);
    return formatQuestion(saved);
  }
  throw new AppError('Could not find an executable question. Please try again.', 502);
}

export async function getDailyQuestion() {
  const question = await fetchDailyGfgQuestion();
  if (!question.isExecutable) {
    return getRandomQuestion();
  }
  const saved = await upsertExternalQuestion(question);
  return formatQuestion(saved);
}

export async function getQuestionById(id) {
  if (isGfgId(id)) {
    const existing = await ExternalQuestion.findOne({ slug: id }).lean();
    if (existing) return formatQuestion(externalDocToQuestion(existing));
    const fetched = await fetchGfgQuestionById(id);
    const saved = await upsertExternalQuestion(fetched);
    return formatQuestion(saved);
  }

  const question = await fetchQuestionBySlug(id);
  return formatQuestion(question);
}

export async function getQuestionWithAllTestCases(id) {
  if (isGfgId(id)) {
    const existing = await ExternalQuestion.findOne({ slug: id }).lean();
    const question = existing
      ? externalDocToQuestion(existing)
      : await upsertExternalQuestion(await fetchGfgQuestionById(id));

    if (!question.isExecutable) {
      throw new AppError('Question is not executable with current runner', 422);
    }
    return question;
  }

  const question = await fetchQuestionBySlug(id);
  if (!question.isExecutable) {
    throw new AppError('Question is not executable with current runner', 422);
  }
  return question;
}
