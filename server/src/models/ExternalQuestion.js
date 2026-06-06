import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isSample: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const externalQuestionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true, index: true },
    externalUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    constraints: { type: String, default: '' },
    examples: [exampleSchema],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    tags: [{ type: String }],
    starterCode: {
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    testCases: [testCaseSchema],
    timeLimitSeconds: { type: Number, default: 5 },
    memoryLimitKb: { type: Number, default: 128000 },
    executionMode: { type: String, enum: ['stdin', 'function'], required: true },
    metaData: { type: mongoose.Schema.Types.Mixed, default: null },
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('ExternalQuestion', externalQuestionSchema);

