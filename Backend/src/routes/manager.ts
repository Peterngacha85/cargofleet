import { Router } from 'express';
import {
  listManagers,
  getPendingVerificationManagers,
  verifyManagerHandler,
  rejectManagerHandler,
  deleteManagerHandler,
  restoreManagerHandler,
} from '../controllers/managerController';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, superAdminMiddleware);

router.get('/', listManagers);
router.get('/pending-verification', getPendingVerificationManagers);
router.post('/:managerId/verify', verifyManagerHandler);
router.post('/:managerId/reject', rejectManagerHandler);
router.delete('/:managerId', deleteManagerHandler);
router.post('/:managerId/restore', restoreManagerHandler);

export default router;
