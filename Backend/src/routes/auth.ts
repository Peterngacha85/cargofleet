import { Router } from 'express';
import {
  superAdminLogin,
  standardLogin,
  googleOAuthLogin,
  registerDriver,
  registerManager,
  refreshTokenHandler,
  getMe,
  completeProfile,
} from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/super-admin/login', authRateLimiter, superAdminLogin);
router.post('/login', authRateLimiter, standardLogin);
router.post('/google/login', authRateLimiter, googleOAuthLogin);
// A license photo is optional at signup, so this route accepts both plain JSON (no photo) and
// multipart/form-data (with one) - upload.single() only engages for actual multipart requests.
router.post('/register/driver', authRateLimiter, upload.single('licensePhoto'), registerDriver);
router.post('/register/manager', authRateLimiter, registerManager);
router.post('/refresh', refreshTokenHandler);
router.get('/me', authMiddleware, getMe);
router.put('/complete-profile', authMiddleware, completeProfile);

export default router;
