import { Router } from 'express';
import { recordPayment, listPayments } from '../controllers/paymentController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['manager', 'admin']));

router.get('/', listPayments);
router.post('/', recordPayment);

export default router;
