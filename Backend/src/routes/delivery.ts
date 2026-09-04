import { Router } from 'express';
import { createDelivery, getDelivery, updateDeliveryStatus } from '../controllers/deliveryController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/:deliveryId', getDelivery);
router.post('/', roleMiddleware(['manager', 'admin']), createDelivery);
router.put('/:deliveryId/status', updateDeliveryStatus);

export default router;
