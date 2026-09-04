import { Router } from 'express';
import {
  getPendingVerificationManagers,
  verifyManagerHandler,
  rejectManagerHandler,
} from '../controllers/managerController';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, superAdminMiddleware);

router.get('/pending-verification', getPendingVerificationManagers);
router.post('/:managerId/verify', verifyManagerHandler);
router.post('/:managerId/reject', rejectManagerHandler);

export default router;
