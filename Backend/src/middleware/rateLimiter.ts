import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'error',
    message: 'Too many requests, please try again later',
    data: null,
    errors: null,
  },
});

export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'error',
    message: 'Too many auth attempts, please try again later',
    data: null,
    errors: null,
  },
});
