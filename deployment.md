# Deployment

This project is designed to run fully locally (no GitHub / no hosted infra required).

## Prerequisites

- Node.js 18+ (recommended: 20+)
- MongoDB (either installed locally or via Docker)
- Optional: Judge0 (either use the public CE endpoint or run locally via Docker)

## 1) Start dependencies (Docker recommended)

From the repo root:

```bash
docker compose up -d mongodb
```

Optional (run your own Judge0 locally):

```bash
docker compose up -d judge0 judge0-db judge0-redis
```

## 2) Configure environment variables

### Server

Copy the example and edit as needed:

```bash
cd server
copy .env.example .env
```

Key variables:

- `MONGODB_URI`
  - Docker Mongo: `mongodb://localhost:27017/oa_practice`
- `CLIENT_URL`
  - Dev: `http://localhost:5173`
- `JUDGE0_API_URL`
  - Public: `https://ce.judge0.com`
  - Local Docker: `http://localhost:2358`

### Client

```bash
cd client
copy .env.example .env
```

Key variables:

- `VITE_API_URL`
  - Dev (recommended): `/api` (and run the server on `:5000` with Vite proxy)
  - Direct: `http://localhost:5000/api`

## 3) Run in development

### Terminal A (server)

```bash
cd server
npm install
npm run dev
```

### Terminal B (client)

```bash
cd client
npm install
npm run dev
```

Open:

- Client: `http://localhost:5173`
- Health check: `http://localhost:5000/health`

## 4) “Deployment-ready” local build (single server)

This produces a production build of the client and serves it from the Express server.

```bash
cd client
npm install
npm run build
```

Then start the server in production mode:

```bash
cd server
npm install
$env:NODE_ENV="production"
npm start
```

Open:

- App: `http://localhost:5000`
- API: `http://localhost:5000/api`

## Notes

- Logs are structured JSON in the server console (request tracing + error reporting).
- Daily contest points are computed locally per submission based on speed (faster accepted submissions score higher).

## Internet Deployment (Free)

This setup uses:

- Frontend: Vercel (free)
- Backend: Render (free)
- Database: MongoDB Atlas (free tier)

### 1) Deploy the backend (Render)

1. Create a free MongoDB Atlas cluster and copy its connection string.
2. Create a new Render “Web Service” from your local folder (or upload the repo as a zip).
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Environment variables to set on Render:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your MongoDB Atlas connection string>`
   - `JUDGE0_API_URL=https://ce.judge0.com` (or your own Judge0)
   - Optional: `LEETCODE_API_URL` (leave default if you want)

After deploy, copy your backend URL:

- `https://<your-render-service>.onrender.com`

### 2) Deploy the frontend (Vercel)

1. Create a new Vercel project.
2. Root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set Vercel environment variable:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`

### 3) Verify

- Open the Vercel URL and start a Random/Daily/Contest session.
- If API calls fail, confirm:
  - `VITE_API_URL` is set to the Render domain (not `/api`)
  - Render environment variables are present and MongoDB Atlas is reachable
