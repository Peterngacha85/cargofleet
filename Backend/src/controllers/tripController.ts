import { Request, Response } from 'express';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Vehicle from '../models/Vehicle';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const generateTripNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Trip.countDocuments({});
  return `TRP-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const { driverId, vehicleId, branchId, pickupLocation, dropoffLocation, estimatedEndTime, fare } = req.body;

    if (!driverId || !vehicleId || !branchId || !pickupLocation || !dropoffLocation || !estimatedEndTime || !fare) {
      return sendError(res, 400, 'Missing required fields');
    }

    const driver = await Driver.findById(driverId);
    if (!driver || driver.status !== 'active') {
      return sendError(res, 400, 'Driver must be active to be assigned a trip');
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== 'active') {
      return sendError(res, 400, 'Vehicle must be active to be assigned a trip');
    }

    const tripNumber = await generateTripNumber();

    const trip = await Trip.create({
      tripNumber,
      driverId,
      vehicleId,
      branchId,
      pickupLocation,
      dropoffLocation,
      estimatedEndTime: new Date(estimatedEndTime),
      fare,
      status: 'scheduled',
    });

    return sendSuccess(res, 201, 'Trip created', { trip });
  } catch (error) {
    logger.error('Create trip error', { error });
    return sendError(res, 500, 'Failed to create trip');
  }
};

export const getTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('deliveryItems');
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }
    return sendSuccess(res, 200, 'Trip retrieved', { trip });
  } catch (error) {
    logger.error('Get trip error', { error });
    return sendError(res, 500, 'Failed to retrieve trip');
  }
};

export const listTrips = async (req: Request, res: Response) => {
  try {
    const { driverId, branchId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (driverId) filter.driverId = driverId;
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const trips = await Trip.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Trips retrieved', { trips, count: trips.length });
  } catch (error) {
    logger.error('List trips error', { error });
    return sendError(res, 500, 'Failed to retrieve trips');
  }
};

export const updateTripStatus = async (req: Request, res: Response) => {
  try {
    const { status, tripEndTime, tripStartTime, fuelUsed } = req.body;

    if (!status) {
      return sendError(res, 400, 'status is required');
    }

    const update: Record<string, unknown> = { status };
    if (tripStartTime) update.tripStartTime = new Date(tripStartTime);
    if (tripEndTime) update.tripEndTime = new Date(tripEndTime);
    if (fuelUsed !== undefined) update.fuelUsed = fuelUsed;

    const trip = await Trip.findByIdAndUpdate(req.params.tripId, update, { new: true });
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (status === 'completed') {
      await Driver.findByIdAndUpdate(trip.driverId, {
        $inc: { totalTrips: 1, completedTrips: 1, totalEarnings: trip.fare },
      });
    }

    return sendSuccess(res, 200, 'Trip status updated', { trip });
  } catch (error) {
    logger.error('Update trip status error', { error });
    return sendError(res, 500, 'Failed to update trip status');
  }
};
