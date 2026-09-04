import { Response } from 'express';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Vehicle from '../models/Vehicle';
import Branch from '../models/Branch';
import Manager from '../models/Manager';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { haversineDistanceKm } from '../utils/geo';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitToDriver } from '../websocket/emitters';

const generateTripNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Trip.countDocuments({});
  return `TRP-${year}-${String(count + 1).padStart(4, '0')}`;
};

const findNearestBranchId = async (latitude: number, longitude: number) => {
  const branches = await Branch.find();
  if (branches.length === 0) return undefined;

  let nearest = branches[0];
  let minDistance = haversineDistanceKm(latitude, longitude, nearest.latitude, nearest.longitude);

  for (const branch of branches.slice(1)) {
    const distance = haversineDistanceKm(latitude, longitude, branch.latitude, branch.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = branch;
    }
  }

  return nearest._id;
};

export const createTrip = async (req: AuthenticatedRequest, res: Response) => {
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
    const destinationBranchId = await findNearestBranchId(dropoffLocation.latitude, dropoffLocation.longitude);

    const trip = await Trip.create({
      tripNumber,
      driverId,
      vehicleId,
      branchId,
      destinationBranchId,
      pickupLocation,
      dropoffLocation,
      estimatedEndTime: new Date(estimatedEndTime),
      fare,
      status: 'scheduled',
    });

    emitToDriver(driverId, 'tripAssigned', {
      tripId: trip._id,
      tripNumber: trip.tripNumber,
      pickupAddress: pickupLocation.address,
      dropoffAddress: dropoffLocation.address,
      estimatedEndTime: trip.estimatedEndTime,
      fare: trip.fare,
    });

    return sendSuccess(res, 201, 'Trip created', { trip });
  } catch (error) {
    logger.error('Create trip error', { error });
    return sendError(res, 500, 'Failed to create trip');
  }
};

export const getTrip = async (req: AuthenticatedRequest, res: Response) => {
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

export const listTrips = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId, branchId, visibleToBranchId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (driverId) filter.driverId = driverId;
    if (status) filter.status = status;

    if (visibleToBranchId) {
      // A trip is relevant to a branch if it's shipping FROM there or landing there.
      filter.$or = [{ branchId: visibleToBranchId }, { destinationBranchId: visibleToBranchId }];
    } else if (branchId) {
      filter.branchId = branchId;
    }

    const trips = await Trip.find(filter)
      .populate({
        path: 'driverId',
        select: 'userId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate('vehicleId', 'registrationNumber make model')
      .populate('branchId', 'name')
      .populate('destinationBranchId', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Trips retrieved', { trips, count: trips.length });
  } catch (error) {
    logger.error('List trips error', { error });
    return sendError(res, 500, 'Failed to retrieve trips');
  }
};

export const updateTripStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, tripEndTime, tripStartTime, fuelUsed } = req.body;

    if (!status) {
      return sendError(res, 400, 'status is required');
    }

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (req.user!.role === 'manager') {
      const manager = await Manager.findOne({ userId: req.user!.id });
      const managerBranchId = manager?.assignedBranchId?.toString();
      const isOriginManager = managerBranchId === trip.branchId.toString();
      const isDestinationManager =
        !!trip.destinationBranchId && managerBranchId === trip.destinationBranchId.toString();

      if (!isOriginManager && !isDestinationManager) {
        return sendError(res, 403, 'You are not authorized to update this trip');
      }
      if (status === 'completed' && !isDestinationManager) {
        return sendError(res, 403, 'Only the destination branch manager can mark this trip as received');
      }
    }

    const update: Record<string, unknown> = { status };
    if (tripStartTime) update.tripStartTime = new Date(tripStartTime);
    if (tripEndTime) update.tripEndTime = new Date(tripEndTime);
    if (fuelUsed !== undefined) update.fuelUsed = fuelUsed;

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.tripId, update, { new: true });

    if (status === 'completed') {
      await Driver.findByIdAndUpdate(trip.driverId, {
        $inc: { totalTrips: 1, completedTrips: 1, totalEarnings: trip.fare },
      });
    }

    return sendSuccess(res, 200, 'Trip status updated', { trip: updatedTrip });
  } catch (error) {
    logger.error('Update trip status error', { error });
    return sendError(res, 500, 'Failed to update trip status');
  }
};
