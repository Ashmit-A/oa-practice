# OA Practice Simulator

A full-stack Online Assessment (OA) practice platform that simulates real coding interview conditions with monitoring, code execution, and automated evaluation.

## Monorepo Structure

```
oa-practice/
├── client/          # React 19 + Vite frontend
├── server/          # Express + MongoDB backend
├── docs/            # Architecture documentation
├── docker-compose.yml
└── README.md
```

## Features

- Random and daily coding questions sourced from [LeetCode via alfa-leetcode-api](https://github.com/alfaarghya/alfa-leetcode-api)
- OA simulation: fullscreen, camera, microphone, tab-switch detection
- Monaco code editor with Python, JavaScript, Java, and C++
- Judge0-powered code execution and evaluation
- Gemini-powered cleanup for GeeksforGeeks problem HTML, examples, and constraints with a `gemini-2.5-flash` to `gemini-1.5-flash-8b` fallback
- Strict local output evaluator that ignores line-margin whitespace and blank lines without calling AI
- Detailed submission results with compliance monitoring summary

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas) — required for assessment sessions and submissions
- Internet access for LeetCode, GeeksforGeeks, Gemini, and Judge0 CE public APIs
- Google Gemini API key for GeeksforGeeks question parsing

## Quick Start

### 1. Start infrastructure (optional)

```bash
docker-compose up -d mongodb
# Optional: docker-compose up -d judge0 judge0-db judge0-redis
```

### 2. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URL` | Frontend URL for CORS |
| `LEETCODE_API_URL` | LeetCode proxy API (default: alfa-leetcode-api) |
| `GEMINI_API_KEY` | Google Gemini API key used by the backend to parse GeeksforGeeks HTML into clean JSON |
| `ASSESSMENT_RUN_COOLDOWN_MS` | Minimum time between sample runs in the same assessment session (default: `8000`) |
| `JUDGE0_API_URL` | Judge0 API base URL (default: `https://ce.judge0.com`) |
| `JUDGE0_API_KEY` | Judge0 auth token (optional for public CE) |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:5000/api`) |

## Build Commands

```bash
# Frontend production build
cd client && npm run build

# Backend production start
cd server && npm start
```

## Deployment

### Frontend (Vercel)

1. Import the repository in Vercel
2. Set root directory to `client`
3. Add environment variable: `VITE_API_URL=https://your-api.onrender.com/api`
4. Deploy

### Backend (Render)

1. Connect repository to Render
2. Use the included `render.yaml` blueprint, or create a Web Service manually
3. Set root/build/start commands from `render.yaml`
4. Configure environment variables (`MONGODB_URI`, `CLIENT_URL`, `GEMINI_API_KEY`, `ASSESSMENT_RUN_COOLDOWN_MS`, Judge0 settings)

`GEMINI_API_KEY` belongs only on the Render backend service. Do not add it to Vercel; the frontend only needs `VITE_API_URL`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions/random` | Random question |
| GET | `/api/questions/daily` | Daily challenge |
| GET | `/api/questions/:id` | Question by ID |
| POST | `/api/assessment/start` | Start assessment session |
| POST | `/api/assessment/run` | Run against sample tests |
| POST | `/api/assessment/submit` | Submit for full evaluation |
| GET | `/api/assessment/result/:id` | Get submission result |
| POST | `/api/monitoring/event` | Log monitoring event |

## Limitations

- Multi-monitor detection is browser-limited and labeled as informational only
- Camera/microphone require user consent; denial is handled gracefully
- Questions are fetched live from LeetCode; problems with complex types (linked lists, trees) are auto-skipped
- GeeksforGeeks problem HTML parsing uses Gemini (`gemini-2.5-flash`, with `gemini-1.5-flash-8b` fallback); fetching new GFG questions requires `GEMINI_API_KEY`
- Generated GeeksforGeeks hidden tests may use Gemini when `GEMINI_API_KEY` is available, but user output correctness is evaluated locally with strict sanitized string equality
- Judge0 CE public API is used by default for code execution (rate limits apply)

## License

MIT
