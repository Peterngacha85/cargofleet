import { Response } from 'express';
import Photo from '../models/Photo';
import Trip from '../models/Trip';
import { uploadFile, deleteFile } from '../services/fileService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { PHOTO_RETENTION_DAYS } from '../utils/constants';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitToAdmins } from '../websocket/emitters';
import { logger } from '../utils/logger';

export const listPhotos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { archiveStatus, tripId } = req.query;
    const filter: Record<string, unknown> = {};
    if (archiveStatus) filter.archiveStatus = archiveStatus;
    if (tripId) filter.tripId = tripId;

    const photos = await Photo.find(filter)
      .populate({
        path: 'driverId',
        select: 'userId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate('tripId', 'tripNumber')
      .sort({ uploadedAt: -1 });

    return sendSuccess(res, 200, 'Photos retrieved', { photos, count: photos.length });
  } catch (error) {
    logger.error('List photos error', { error });
    return sendError(res, 500, 'Failed to retrieve photos');
  }
};

export const uploadPhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    const { deliveryId, tripId, driverId, photoType } = req.body;

    if (!file) {
      return sendError(res, 400, 'No file uploaded');
    }
    if (!deliveryId || !tripId || !driverId || !photoType) {
      return sendError(res, 400, 'Missing required fields');
    }

    const { url, key } = await uploadFile(file.buffer, file.originalname, file.mimetype, 'deliveries');

    const scheduledDeleteAt = new Date();
    scheduledDeleteAt.setDate(scheduledDeleteAt.getDate() + PHOTO_RETENTION_DAYS);

    const photo = await Photo.create({
      deliveryId,
      tripId,
      driverId,
      photoType,
      cloudflareUrl: url,
      uploadedBy: req.user!.id,
      scheduledDeleteAt,
      metadata: {
        filename: key,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    const trip = await Trip.findById(tripId).select('tripNumber');
    emitToAdmins('newPhotoUpload', {
      photoId: photo._id,
      photoType,
      tripId,
      tripNumber: trip?.tripNumber,
    });

    return sendSuccess(res, 201, 'Photo uploaded', { photo });
  } catch (error) {
    logger.error('Upload photo error', { error });
    return sendError(res, 500, 'Failed to upload photo');
  }
};

export const approvePhotoDeletion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { archiveReason } = req.body;

    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return sendError(res, 404, 'Photo not found');
    }

    await deleteFile(photo.metadata.filename);

    photo.archiveStatus = 'deleted';
    photo.archiveReason = archiveReason;
    photo.approvedBy = req.user!.id;
    photo.approvedAt = new Date();
    await photo.save();

    return sendSuccess(res, 200, 'Photo deletion approved', { photo });
  } catch (error) {
    logger.error('Approve photo deletion error', { error });
    return sendError(res, 500, 'Failed to approve photo deletion');
  }
};

export const archivePhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const photo = await Photo.findByIdAndUpdate(
      req.params.photoId,
      { archiveStatus: 'archived', approvedBy: req.user!.id, approvedAt: new Date() },
      { new: true }
    );

    if (!photo) {
      return sendError(res, 404, 'Photo not found');
    }

    return sendSuccess(res, 200, 'Photo archived', { photo });
  } catch (error) {
    logger.error('Archive photo error', { error });
    return sendError(res, 500, 'Failed to archive photo');
  }
};
