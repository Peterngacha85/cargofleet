import { Router } from 'express';
import { createTrip, getTrip, listTrips, updateTripStatus } from '../controllers/tripController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listTrips);
router.get('/:tripId', getTrip);
router.post('/', roleMiddleware(['manager', 'admin']), createTrip);
router.put('/:tripId/status', updateTripStatus);

export default router;
