import { Router } from 'express';
import { getDriverLatestLocation, getTripLocationHistory } from '../controllers/locationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/driver/:driverId/latest', getDriverLatestLocation);
router.get('/trip/:tripId/history', getTripLocationHistory);

export default router;
