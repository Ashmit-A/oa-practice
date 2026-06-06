import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const requestId = req.requestId;

  const meta = {
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    operational: Boolean(err.isOperational),
    errorName: err.name,
    errorMessage: err.message,
  };

  if (err.isOperational) {
    logger.warn('request_error', meta);
  } else {
    logger.error('request_error', { ...meta, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    requestId,
    ...(process.env.NODE_ENV === 'development' && !err.isOperational
      ? { stack: err.stack }
      : {}),
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
