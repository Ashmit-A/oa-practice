# OA Practice — Client

React 19 frontend for the OA Practice Simulator.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

For production on Vercel, set `VITE_API_URL` to your deployed backend URL.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Deployment (Vercel)

1. Set project root to `client/`
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add `VITE_API_URL` environment variable
6. `vercel.json` handles SPA routing

## Pages

- `/` — Landing page
- `/random` — Random question
- `/daily` — Daily challenge
- `/assessment/:questionId` — Coding assessment
- `/results/:submissionId` — Submission results
