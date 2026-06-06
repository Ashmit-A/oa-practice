import mongoose from 'mongoose';

const assessmentSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    questionSlug: { type: String, required: true, index: true },
    mode: {
      type: String,
      enum: ['random', 'daily', 'contest'],
      default: 'random',
    },
    status: {
      type: String,
      enum: ['active', 'submitted', 'expired'],
      default: 'active',
    },
    startedAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number, default: 2400 },
    expiresAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('AssessmentSession', assessmentSessionSchema);
