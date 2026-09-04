import multer from 'multer';
import { config } from '../config/environment';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (!config.upload.allowedFileTypes.includes(file.mimetype)) {
      return cb(new AppError(400, `Unsupported file type: ${file.mimetype}`) as unknown as Error);
    }
    cb(null, true);
  },
});
