import { Router } from 'express';
import { getPublicTracking, getPublicRatingInfo, submitPublicRating } from '../controllers/publicController';

// Deliberately no authMiddleware anywhere in this file - it's the app's only unauthenticated
// surface, reached via an opaque per-trip token instead of a login. Kept in its own route
// file rather than adding exceptions to an existing router, since every other router applies
// authMiddleware file-wide with no per-route opt-out.
const router = Router();

router.get('/track/:token', getPublicTracking);
router.get('/rate/:token', getPublicRatingInfo);
router.post('/rate/:token', submitPublicRating);

export default router;
