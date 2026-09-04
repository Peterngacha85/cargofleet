import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data,
    errors: null,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors: Record<string, unknown> | null = null
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    data: null,
    errors,
  });
};
