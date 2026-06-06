import { fetchQuestionBySlug } from '../services/leetcodeApiService.js';
import { wrapUserCode } from '../utils/codeRunner.js';
import { executeCode } from '../services/judge0Service.js';

const pythonSolution = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
        return []`;

async function test() {
  const question = await fetchQuestionBySlug('two-sum');
  console.log('Question:', question.title, '| test cases:', question.testCases.length);

  const wrapped = wrapUserCode(pythonSolution, 'python', question.metaData);
  const testCase = question.testCases[0];

  const result = await executeCode({
    sourceCode: wrapped,
    language: 'python',
    stdin: testCase.input,
    timeLimitSeconds: 5,
    memoryLimitKb: 128000,
  });

  console.log('Verdict:', result.verdict);
  console.log('Stdout:', result.stdout?.trim());
  console.log('Expected:', testCase.expectedOutput);
  console.log('Stderr:', result.stderr || '(none)');
}

test().catch((err) => {
  console.error(err);
  process.exit(1);
});
