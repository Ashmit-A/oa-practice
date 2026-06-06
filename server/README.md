# OA Practice — Server

Express.js API with MongoDB and Judge0 integration.

## Setup

```bash
npm install
cp .env.example .env
# Start MongoDB (docker-compose up -d mongodb)
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/oa_practice` |
| `CLIENT_URL` | CORS origin | `http://localhost:5173` |
| `LEETCODE_API_URL` | LeetCode proxy API | `https://alfa-leetcode-api.onrender.com` |
| `JUDGE0_API_URL` | Judge0 API URL | `https://ce.judge0.com` |
| `JUDGE0_API_KEY` | Judge0 auth token | (empty) |
| `JUDGE0_USE_WAIT` | Synchronous Judge0 calls | `true` |
| `JUDGE0_POLL_INTERVAL_MS` | Poll interval | `1000` |
| `JUDGE0_MAX_POLL_ATTEMPTS` | Max poll attempts | `30` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm start` | Production start |
| `node src/scripts/testExecution.js` | Verify LeetCode + Judge0 pipeline |

## Deployment (Render)

Use the root `render.yaml` or configure manually:

- **Build:** `cd server && npm install`
- **Start:** `cd server && npm start`
- **Health check:** `/health`

Set `MONGODB_URI` to MongoDB Atlas and `CLIENT_URL` to your Vercel URL. Judge0 defaults to the public CE endpoint.

## Question Source

Questions are fetched live from LeetCode using:
- [alfa-leetcode-api](https://github.com/alfaarghya/alfa-leetcode-api) for problem lists and daily challenge
- [leetcode.com/graphql](https://leetcode.com/graphql) for code snippets and test metadata

## Architecture

```
src/
├── config/       # Environment and database
├── controllers/  # Request handlers
├── middleware/   # Error handling
├── models/       # Mongoose schemas
├── routes/       # API routes
├── services/     # Business logic + Judge0
├── seed/         # Database seed data
└── utils/        # Helpers
```

## Judge0

For local development, start Judge0 via Docker Compose:

```bash
docker-compose up -d judge0 judge0-db judge0-redis
```

Alternatively, use a hosted Judge0 API (e.g. RapidAPI) and set `JUDGE0_API_URL` and `JUDGE0_API_KEY`.
