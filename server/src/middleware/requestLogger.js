import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export default function requestLogger(req, res, next) {
  const requestId = uuidv4();
  req.requestId = requestId;

  const start = Date.now();
  logger.info('request_start', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  res.on('finish', () => {
    logger.info('request_end', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}

