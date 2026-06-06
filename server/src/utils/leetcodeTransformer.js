const UNSUPPORTED_TYPES = [
  'ListNode',
  'TreeNode',
  'Node',
  'DoublyListNode',
  'NestedInteger',
  'character',
  'ListNode[]',
  'TreeNode[]',
];

function isTypeSupported(type) {
  if (!type) return false;
  return !UNSUPPORTED_TYPES.some((t) => type.includes(t));
}

export function parseMetaData(metaDataRaw) {
  if (!metaDataRaw) return null;
  try {
    return typeof metaDataRaw === 'string' ? JSON.parse(metaDataRaw) : metaDataRaw;
  } catch {
    return null;
  }
}

export function isExecutableMetaData(metaData) {
  if (!metaData || metaData.manual) return false;
  const params = metaData.params || [];
  const ret = metaData.return?.type;
  if (!metaData.name || !ret) return false;
  if (!isTypeSupported(ret)) return false;
  return params.every((p) => isTypeSupported(p.type));
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

function parseExamplesFromContent(content) {
  const text = stripHtml(content);
  const examples = [];
  const blocks = text.split(/Example\s+\d+\s*:/i).slice(1);

  for (const block of blocks) {
    const outputMatch = block.match(/Output:\s*(\[[^\]]*\]|"[^"]*"|[^\s\n]+)/i);
    if (outputMatch) {
      examples.push({ output: outputMatch[1].trim() });
    }
  }

  return examples;
}

function parseExampleTestcases(exampleTestcases, paramCount) {
  if (!exampleTestcases) return [];
  if (!paramCount || paramCount <= 0) return [];
  const lines = exampleTestcases
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const groups = [];
  for (let i = 0; i < lines.length; i += paramCount) {
    const chunk = lines.slice(i, i + paramCount);
    if (chunk.length === paramCount) {
      groups.push(chunk.join('\n'));
    }
  }
  return groups;
}

function normalizeOutput(value) {
  return decodeHtmlEntities(String(value)).replace(/\s+/g, '').trim();
}

function mapStarterCode(codeSnippets = []) {
  const find = (slug) => codeSnippets.find((s) => s.langSlug === slug)?.code || '';

  return {
    python: find('python3') || find('python'),
    javascript: find('javascript'),
    java: find('java'),
    cpp: find('cpp'),
  };
}

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

function formatExampleInput(params, input) {
  if (!params?.length) return decodeHtmlEntities(input);
  const lines = String(input)
    .split('\n')
    .map((l) => decodeHtmlEntities(l.trim()))
    .filter(Boolean);
  if (lines.length !== params.length) return lines.join('\n');
  return params.map((p, idx) => `${p.name} = ${lines[idx]}`).join(', ');
}

export function buildQuestionFromLeetCode(graphqlQuestion, alfaQuestion) {
  const metaData = parseMetaData(graphqlQuestion.metaData);
  const paramCount = metaData?.params?.length || 0;
  const inputGroups = parseExampleTestcases(graphqlQuestion.exampleTestcases, paramCount);
  const parsedExamples = parseExamplesFromContent(
    alfaQuestion?.question || graphqlQuestion.content
  );

  const examples = inputGroups.map((input, idx) => ({
    input: formatExampleInput(metaData?.params, input),
    output: parsedExamples[idx]?.output || '',
    explanation: '',
  }));

  const testCases = inputGroups.map((input, idx) => ({
    input,
    expectedOutput: normalizeOutput(parsedExamples[idx]?.output || ''),
    isSample: idx < Math.min(2, inputGroups.length),
    isHidden: idx >= Math.min(2, inputGroups.length),
  }));

  const tags = (alfaQuestion?.topicTags || []).map((t) => t.name).filter(Boolean);

  return {
    id: graphqlQuestion.titleSlug,
    titleSlug: graphqlQuestion.titleSlug,
    title: graphqlQuestion.title,
    description: stripHtml(graphqlQuestion.content),
    constraints: extractConstraints(stripHtml(graphqlQuestion.content)),
    examples,
    difficulty: graphqlQuestion.difficulty,
    tags,
    starterCode: mapStarterCode(graphqlQuestion.codeSnippets),
    sampleTestCases: testCases.filter((tc) => tc.isSample),
    testCases,
    metaData,
    isExecutable: isExecutableMetaData(metaData) && testCases.length > 0,
    timeLimitSeconds: 5,
    memoryLimitKb: 128000,
    executionMode: 'function',
    source: 'leetcode',
    externalUrl: `https://leetcode.com/problems/${graphqlQuestion.titleSlug}/`,
  };
}

function extractConstraints(text) {
  const match = text.match(/Constraints:\s*([\s\S]*?)(?:Follow-up:|$)/i);
  return match ? match[1].trim() : '';
}
