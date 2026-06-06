import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import logger from './utils/logger.js';

const app = express();

app.use(requestLogger);
const allowedOrigins = [
  'http://localhost:5173',
  'https://oa-practice-peach.vercel.app'
];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'oa-practice-api',
    status: 'running'
  });
});

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await connectDatabase();
  app.listen(env.port, () => {
    logger.info('server_start', { port: env.port, nodeEnv: env.nodeEnv });
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

startServer();

export default app;
