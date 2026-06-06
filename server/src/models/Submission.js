import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema(
  {
    testCaseIndex: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    stderr: { type: String, default: '' },
    verdict: { type: String },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    questionSlug: { type: String, required: true, index: true },
    mode: { type: String, default: 'random' },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    verdict: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Runtime Error',
        'Compilation Error',
        'Time Limit Exceeded',
        'Internal Error',
      ],
      required: true,
    },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    testResults: [testResultSchema],
    durationSeconds: { type: Number, default: 2400 },
    timeTakenSeconds: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    timedOut: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);
