import { Request, Response } from 'express';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import DriverRating from '../models/DriverRating';
import { getLatestLocationForDriver } from '../services/locationService';
import { computeRatingImpact, recalculateDriverAverageRating } from '../services/ratingService';
import { uploadFile } from '../services/fileService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// Deliberately returns only what a customer watching their own delivery needs - no phone
// numbers, no other trips, no internal ids beyond the trip's own public-facing details.
export const getPublicTracking = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findOne({ publicTrackingToken: req.params.token });
    if (!trip) {
      return sendError(res, 404, 'Tracking link not found or expired');
    }

    const [driver, location] = await Promise.all([
      Driver.findById(trip.driverId).populate<{ userId: { firstName: string } }>('userId', 'firstName'),
      getLatestLocationForDriver(trip.driverId.toString()),
    ]);

    return sendSuccess(res, 200, 'Tracking info retrieved', {
      tripNumber: trip.tripNumber,
      status: trip.status,
      dropoffAddress: trip.dropoffLocation.address,
      driverFirstName: driver?.userId?.firstName,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude, timestamp: location.timestamp }
        : null,
    });
  } catch (error) {
    logger.error('Get public tracking error', { error });
    return sendError(res, 500, 'Failed to retrieve tracking info');
  }
};

export const getPublicRatingInfo = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findOne({ publicRatingToken: req.params.token }).populate({
      path: 'driverId',
      select: 'userId',
      populate: { path: 'userId', select: 'firstName lastName' },
    });
    if (!trip) {
      return sendError(res, 404, 'Rating link not found or expired');
    }

    const driver = trip.driverId as unknown as { userId?: { firstName: string; lastName: string } };

    return sendSuccess(res, 200, 'Rating info retrieved', {
      tripNumber: trip.tripNumber,
      driverName: driver?.userId ? `${driver.userId.firstName} ${driver.userId.lastName}` : undefined,
      tripStatus: trip.status,
      alreadyRated: !!trip.ratingSubmittedAt,
    });
  } catch (error) {
    logger.error('Get public rating info error', { error });
    return sendError(res, 500, 'Failed to retrieve rating info');
  }
};

// Separate from the authenticated createRating handler (routes/rating.ts) - a customer
// reaching this via the public link has no logged-in user, so there's no req.user to take
// ratedByUserId from, and the trip/already-rated checks are keyed on the token, not a role.
export const submitPublicRating = async (req: Request, res: Response) => {
  try {
    const { rating, comment, customerName, customerPhone, positiveAspects, negativeAspects, signatureDataUrl } =
      req.body;

    if (!rating) {
      return sendError(res, 400, 'rating is required');
    }

    const trip = await Trip.findOne({ publicRatingToken: req.params.token });
    if (!trip) {
      return sendError(res, 404, 'Rating link not found or expired');
    }
    if (trip.status !== 'completed') {
      return sendError(res, 400, 'This trip is not yet completed');
    }
    if (trip.ratingSubmittedAt) {
      return sendError(res, 409, 'This trip has already been rated');
    }

    const existing = await DriverRating.findOne({ tripId: trip._id });
    if (existing) {
      trip.ratingSubmittedAt = new Date();
      await trip.save();
      return sendError(res, 409, 'This trip has already been rated');
    }

    const numericRating = Number(rating);
    const quality = numericRating >= 4 ? 'excellent' : numericRating >= 3 ? 'good' : 'poor';
    const ratingImpact = computeRatingImpact(numericRating, trip.fare);

    let customerSignature: string | undefined;
    if (typeof signatureDataUrl === 'string' && signatureDataUrl.startsWith('data:image/')) {
      const base64 = signatureDataUrl.split(',')[1];
      if (base64) {
        const { url } = await uploadFile(Buffer.from(base64, 'base64'), 'signature.png', 'image/png', 'signatures');
        customerSignature = url;
      }
    }

    await DriverRating.create({
      driverId: trip.driverId,
      tripId: trip._id,
      rating: numericRating,
      ratedBy: 'customer',
      comment,
      deliveryQuality: quality,
      timeliness: 'on_time',
      professionalism: quality,
      positiveAspects,
      negativeAspects,
      customerName,
      customerPhone,
      customerSignature,
      ratingImpact,
    });

    trip.ratingSubmittedAt = new Date();
    await trip.save();

    await recalculateDriverAverageRating(trip.driverId.toString());

    return sendSuccess(res, 201, 'Thank you for your feedback!', {});
  } catch (error) {
    logger.error('Submit public rating error', { error });
    return sendError(res, 500, 'Failed to submit rating');
  }
};
