import { Router } from 'express';
import { createRating } from '../controllers/ratingController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', roleMiddleware(['manager', 'admin']), createRating);

export default router;
