import { Router } from 'express';
import { listBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listBranches);
router.post('/', superAdminMiddleware, createBranch);
router.put('/:branchId', superAdminMiddleware, updateBranch);
router.delete('/:branchId', superAdminMiddleware, deleteBranch);

export default router;
