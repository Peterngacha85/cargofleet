import { Router } from 'express';
import { uploadPhoto, approvePhotoDeletion, archivePhoto } from '../controllers/photoController';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

router.post('/upload', upload.single('file'), uploadPhoto);
router.post('/:photoId/approve-deletion', superAdminMiddleware, approvePhotoDeletion);
router.post('/:photoId/archive', superAdminMiddleware, archivePhoto);

export default router;
