import { Router } from 'express';
import { getBranchAnalytics, getSystemAnalytics } from '../controllers/analyticsController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, roleMiddleware(['manager', 'admin']));

// Must come before /branch/:branchId so "system" isn't matched as a branch id.
router.get('/system', roleMiddleware(['admin']), getSystemAnalytics);
router.get('/branch/:branchId', getBranchAnalytics);

export default router;
