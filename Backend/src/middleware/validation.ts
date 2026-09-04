import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted: Record<string, unknown> = {};
    errors.array().forEach((err) => {
      if ('path' in err) {
        formatted[err.path] = err.msg;
      }
    });
    return sendError(res, 400, 'Validation failed', formatted);
  }
  next();
};
