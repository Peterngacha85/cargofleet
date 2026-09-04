import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  statusCode: number;
  errors: Record<string, unknown> | null;

  constructor(statusCode: number, message: string, errors: Record<string, unknown> | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  logger.error('Unhandled error', { error: err });
  const message = err instanceof Error ? err.message : 'Internal server error';
  return sendError(res, 500, 'Internal server error', { error: message });
};
