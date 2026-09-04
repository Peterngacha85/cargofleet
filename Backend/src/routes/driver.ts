import { Router } from 'express';
import {
  listDrivers,
  getDriverProfile,
  getPendingApprovalDrivers,
  approveDriverHandler,
  rejectDriverHandler,
  assignVehicleHandler,
  reassignBranchHandler,
  getDriverRatings,
} from '../controllers/driverController';
import { authMiddleware, roleMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['manager', 'admin']), listDrivers);
router.get('/pending-approval', roleMiddleware(['manager', 'admin']), getPendingApprovalDrivers);
router.get('/:driverId', getDriverProfile);
router.get('/:driverId/ratings', getDriverRatings);
router.post('/:driverId/approve', roleMiddleware(['manager', 'admin']), approveDriverHandler);
router.post('/:driverId/reject', roleMiddleware(['manager', 'admin']), rejectDriverHandler);
router.post('/:driverId/assign-vehicle', roleMiddleware(['manager', 'admin']), assignVehicleHandler);
router.post('/:driverId/reassign-branch', superAdminMiddleware, reassignBranchHandler);

export default router;
