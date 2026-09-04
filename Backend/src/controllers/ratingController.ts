import { Response } from 'express';
import DriverRating from '../models/DriverRating';
import Trip from '../models/Trip';
import { computeRatingImpact, recalculateDriverAverageRating } from '../services/ratingService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const createRating = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      driverId,
      tripId,
      rating,
      ratedBy,
      comment,
      deliveryQuality,
      timeliness,
      professionalism,
      positiveAspects,
      negativeAspects,
      customerName,
      customerPhone,
    } = req.body;

    if (!driverId || !tripId || !rating || !ratedBy || !deliveryQuality || !timeliness || !professionalism) {
      return sendError(res, 400, 'Missing required fields');
    }

    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== 'completed') {
      return sendError(res, 400, 'Can only rate a completed trip');
    }

    const existing = await DriverRating.findOne({ tripId });
    if (existing) {
      return sendError(res, 409, 'This trip has already been rated');
    }

    const ratingImpact = computeRatingImpact(rating, trip.fare);

    const driverRating = await DriverRating.create({
      driverId,
      tripId,
      rating,
      ratedBy,
      ratedByUserId: req.user!.id,
      comment,
      deliveryQuality,
      timeliness,
      professionalism,
      positiveAspects,
      negativeAspects,
      customerName,
      customerPhone,
      ratingImpact,
    });

    await recalculateDriverAverageRating(driverId);

    return sendSuccess(res, 201, 'Driver rated successfully', { rating: driverRating });
  } catch (error) {
    logger.error('Create rating error', { error });
    return sendError(res, 500, 'Failed to submit rating');
  }
};
