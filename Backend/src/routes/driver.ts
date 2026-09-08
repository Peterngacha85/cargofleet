import { Router } from 'express';
import {
  listDrivers,
  getDriverProfile,
  getPendingApprovalDrivers,
  getPendingDeletionDrivers,
  approveDriverHandler,
  rejectDriverHandler,
  assignVehicleHandler,
  reassignBranchHandler,
  requestDriverDeletionHandler,
  dismissDriverDeletionRequestHandler,
  deleteDriverHandler,
  restoreDriverHandler,
  getDriverRatings,
  getDriverPerformance,
} from '../controllers/driverController';
import { authMiddleware, roleMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['manager', 'admin']), listDrivers);
router.get('/pending-approval', roleMiddleware(['manager', 'admin']), getPendingApprovalDrivers);
// Registered before the generic /:driverId routes below, same reason /pending-approval is.
router.get('/pending-deletion', superAdminMiddleware, getPendingDeletionDrivers);
router.get('/:driverId', getDriverProfile);
router.get('/:driverId/ratings', getDriverRatings);
router.get('/:driverId/performance', getDriverPerformance);
router.post('/:driverId/approve', roleMiddleware(['manager', 'admin']), approveDriverHandler);
router.post('/:driverId/reject', roleMiddleware(['manager', 'admin']), rejectDriverHandler);
router.post('/:driverId/assign-vehicle', roleMiddleware(['manager', 'admin']), assignVehicleHandler);
router.post('/:driverId/reassign-branch', superAdminMiddleware, reassignBranchHandler);
router.post('/:driverId/request-deletion', roleMiddleware(['manager']), requestDriverDeletionHandler);
router.post('/:driverId/dismiss-deletion-request', superAdminMiddleware, dismissDriverDeletionRequestHandler);
router.delete('/:driverId', superAdminMiddleware, deleteDriverHandler);
router.post('/:driverId/restore', superAdminMiddleware, restoreDriverHandler);

export default router;
