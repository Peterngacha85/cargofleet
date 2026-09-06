import { Router } from 'express';
import { createTrip, getTrip, listTrips, updateTripStatus, completeTripWithPhoto } from '../controllers/tripController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', listTrips);
router.get('/:tripId', getTrip);
router.post('/', roleMiddleware(['manager', 'admin']), createTrip);
router.put('/:tripId/status', roleMiddleware(['manager', 'admin']), updateTripStatus);
router.post(
  '/:tripId/complete',
  roleMiddleware(['manager', 'admin']),
  upload.single('photo'),
  completeTripWithPhoto
);

export default router;
