import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import apiRoutes from './routes/apiRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import logger from './utils/logger.js';

const app = express();

app.use(requestLogger);
app.use(
  cors({
    origin: env.nodeEnv === 'production' ? true : env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

if (env.nodeEnv === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.resolve(__dirname, '../../client/dist');

  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
