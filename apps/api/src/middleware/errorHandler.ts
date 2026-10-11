import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

/** Every error leaves the API in the same shape. Stack traces and internals are never sent to clients. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  // Body-parser and similar libraries attach an HTTP status to client mistakes (bad JSON, body too large).
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) req.log.error({ err }, 'Unhandled error');
  res.status(status).json({
    error: status === 500
      ? { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
      : { code: 'BAD_REQUEST', message: 'Bad request' },
  });
};
