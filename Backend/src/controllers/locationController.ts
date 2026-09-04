import { Request, Response } from 'express';
import { getLatestLocationForDriver, getLocationHistoryForTrip } from '../services/locationService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const getDriverLatestLocation = async (req: Request, res: Response) => {
  try {
    const location = await getLatestLocationForDriver(req.params.driverId);
    if (!location) {
      return sendError(res, 404, 'No location data found for this driver');
    }
    return sendSuccess(res, 200, 'Latest location retrieved', { location });
  } catch (error) {
    logger.error('Get driver location error', { error });
    return sendError(res, 500, 'Failed to retrieve location');
  }
};

export const getTripLocationHistory = async (req: Request, res: Response) => {
  try {
    const history = await getLocationHistoryForTrip(req.params.tripId);
    return sendSuccess(res, 200, 'Location history retrieved', { history, count: history.length });
  } catch (error) {
    logger.error('Get trip location history error', { error });
    return sendError(res, 500, 'Failed to retrieve location history');
  }
};
