import { Router } from 'express';
import { recordPayment, listPayments } from '../controllers/paymentController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// A driver may view their own payment history (scoped to their own driverId inside the
// controller) - recording one stays manager/admin only.
router.get('/', listPayments);
router.post('/', roleMiddleware(['manager', 'admin']), recordPayment);

export default router;
