import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { sendError } from '../utils/apiResponse';
import { TokenPayload } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No authorization token', { authorization: 'Missing Bearer token' });
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token', {
      authorization: error instanceof Error ? error.message : 'Auth failed',
    });
  }
};

export const superAdminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user || user.role !== 'admin' || !user.id.startsWith('super_admin_')) {
    return sendError(res, 403, 'Insufficient permissions', { authorization: 'Super admin access required' });
  }

  next();
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return sendError(res, 403, 'Insufficient permissions', {
        authorization: `Access denied for role: ${user?.role ?? 'unknown'}`,
      });
    }

    next();
  };
};
