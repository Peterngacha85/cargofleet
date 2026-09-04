import { Router } from 'express';
import {
  listManagers,
  getPendingVerificationManagers,
  verifyManagerHandler,
  rejectManagerHandler,
} from '../controllers/managerController';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, superAdminMiddleware);

router.get('/', listManagers);
router.get('/pending-verification', getPendingVerificationManagers);
router.post('/:managerId/verify', verifyManagerHandler);
router.post('/:managerId/reject', rejectManagerHandler);

export default router;
