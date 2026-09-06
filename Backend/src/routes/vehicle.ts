import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  getPendingVerificationVehicles,
  verifyVehicle,
  rejectVehicle,
} from '../controllers/vehicleController';
import { authMiddleware, roleMiddleware, superAdminMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

// Must come before /:vehicleId so "pending-verification" isn't matched as an id.
router.get('/pending-verification', superAdminMiddleware, getPendingVerificationVehicles);

router.get('/', listVehicles);
router.get('/:vehicleId', getVehicle);
router.post('/', roleMiddleware(['manager', 'admin']), upload.single('photo'), createVehicle);
router.put('/:vehicleId', roleMiddleware(['manager', 'admin']), upload.single('photo'), updateVehicle);
router.post('/:vehicleId/verify', superAdminMiddleware, verifyVehicle);
router.post('/:vehicleId/reject', superAdminMiddleware, rejectVehicle);

export default router;
