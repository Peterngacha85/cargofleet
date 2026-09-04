import { Router } from 'express';
import { listVehicles, getVehicle, createVehicle, updateVehicle } from '../controllers/vehicleController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listVehicles);
router.get('/:vehicleId', getVehicle);
router.post('/', roleMiddleware(['manager', 'admin']), createVehicle);
router.put('/:vehicleId', roleMiddleware(['manager', 'admin']), updateVehicle);

export default router;
