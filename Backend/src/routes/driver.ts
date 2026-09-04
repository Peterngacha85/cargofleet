import { Router } from 'express';
import {
  getDriverProfile,
  getPendingApprovalDrivers,
  approveDriverHandler,
  rejectDriverHandler,
  assignVehicleHandler,
  getDriverRatings,
} from '../controllers/driverController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/pending-approval', roleMiddleware(['manager', 'admin']), getPendingApprovalDrivers);
router.get('/:driverId', getDriverProfile);
router.get('/:driverId/ratings', getDriverRatings);
router.post('/:driverId/approve', roleMiddleware(['manager', 'admin']), approveDriverHandler);
router.post('/:driverId/reject', roleMiddleware(['manager', 'admin']), rejectDriverHandler);
router.post('/:driverId/assign-vehicle', roleMiddleware(['manager', 'admin']), assignVehicleHandler);

export default router;
