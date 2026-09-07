import { Router } from 'express';
import { logFuel, listFuelLogs } from '../controllers/fuelLogController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', listFuelLogs);
router.post('/', upload.single('receipt'), logFuel);

export default router;
