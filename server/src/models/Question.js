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
    isSample: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    constraints: { type: String, required: true },
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
    timeLimitSeconds: { type: Number, default: 2 },
    memoryLimitKb: { type: Number, default: 128000 },
  },
  { timestamps: true }
);

questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });

export default mongoose.model('Question', questionSchema);
