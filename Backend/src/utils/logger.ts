import winston from 'winston';
import { config } from '../config/environment';

// winston's errors() format only unwraps an Error passed as the log message itself;
// our call sites log `logger.error('text', { error })`, so unwrap that nested case too.
const unwrapNestedError = winston.format((info) => {
  if (info.error instanceof Error) {
    info.error = { message: info.error.message, stack: info.error.stack };
  }
  return info;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    unwrapNestedError(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});
