import { Router } from 'express';
import { getBranchAnalytics } from '../controllers/analyticsController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, roleMiddleware(['manager', 'admin']));

router.get('/branch/:branchId', getBranchAnalytics);

export default router;
