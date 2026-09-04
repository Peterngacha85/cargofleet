import { Router } from 'express';
import {
  superAdminLogin,
  standardLogin,
  googleOAuthLogin,
  registerDriver,
  registerManager,
  refreshTokenHandler,
  getMe,
} from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/super-admin/login', authRateLimiter, superAdminLogin);
router.post('/login', authRateLimiter, standardLogin);
router.post('/google/login', authRateLimiter, googleOAuthLogin);
router.post('/register/driver', authRateLimiter, registerDriver);
router.post('/register/manager', authRateLimiter, registerManager);
router.post('/refresh', refreshTokenHandler);
router.get('/me', authMiddleware, getMe);

export default router;
