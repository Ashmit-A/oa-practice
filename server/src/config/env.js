import dotenv from 'dotenv';

dotenv.config();
// console.log("URI exists:", !!process.env.MONGODB_URI);
const judge0Url = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/$/, '');

const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/oa_practice',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  leetcode: {
    apiUrl: (process.env.LEETCODE_API_URL || 'https://alfa-leetcode-api.onrender.com').replace(
      /\/$/,
      ''
    ),
  },
  assessment: {
    runCooldownMs: parseInt(process.env.ASSESSMENT_RUN_COOLDOWN_MS || '8000', 10),
  },
  judge0: {
    apiUrl: judge0Url,
    apiKey: process.env.JUDGE0_API_KEY || '',
    rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || '',
    rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
    pollIntervalMs: parseInt(process.env.JUDGE0_POLL_INTERVAL_MS || '1000', 10),
    maxPollAttempts: parseInt(process.env.JUDGE0_MAX_POLL_ATTEMPTS || '30', 10),
    useWait: process.env.JUDGE0_USE_WAIT !== 'false',
  },
};

export default env;
