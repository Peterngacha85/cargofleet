import { Response } from 'express';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Vehicle from '../models/Vehicle';
import Branch from '../models/Branch';
import Manager from '../models/Manager';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { haversineDistanceKm } from '../utils/geo';
import { uploadFile } from '../services/fileService';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitToDriver } from '../websocket/emitters';

// Shared by updateTripStatus and completeTripWithPhoto - a manager may only mark a trip
// received if it's actually landing at their branch, not just any trip passing through.
const assertCanMarkReceived = async (trip: InstanceType<typeof Trip>, userId: string, role: string) => {
  if (role !== 'manager') return { authorized: true };

  const manager = await Manager.findOne({ userId });
  const managerBranchId = manager?.assignedBranchId?.toString();
  const isOriginManager = managerBranchId === trip.branchId.toString();
  const isDestinationManager = !!trip.destinationBranchId && managerBranchId === trip.destinationBranchId.toString();

  if (!isOriginManager && !isDestinationManager) {
    return { authorized: false, message: 'You are not authorized to update this trip' };
  }
  if (!isDestinationManager) {
    return { authorized: false, message: 'Only the destination branch manager can mark this trip as received' };
  }
  return { authorized: true };
};

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

// A driver/vehicle already on a scheduled or in-transit trip can't be handed a second one at
// the same time - shared by createTrip and reassignTripHandler, the two places that assign
// a driver/vehicle to a trip.
const findConflictingTrip = async (field: 'driverId' | 'vehicleId', id: string, excludeTripId?: string) => {
  const filter: Record<string, unknown> = {
    [field]: id,
    status: { $in: ['scheduled', 'in_transit'] },
    isDeleted: { $ne: true },
  };
  if (excludeTripId) filter._id = { $ne: excludeTripId };
  return Trip.findOne(filter);
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

    const conflictingDriverTrip = await findConflictingTrip('driverId', driverId);
    if (conflictingDriverTrip) {
      return sendError(res, 400, `Driver is already assigned to trip ${conflictingDriverTrip.tripNumber}`);
    }

    const conflictingVehicleTrip = await findConflictingTrip('vehicleId', vehicleId);
    if (conflictingVehicleTrip) {
      return sendError(res, 400, `Vehicle is already assigned to trip ${conflictingVehicleTrip.tripNumber}`);
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

// A manager may only reassign trips shipping out of their own branch, mirroring the
// origin-manager check in updateTripStatus - admins aren't scoped to a branch at all.
const assertCanReassign = async (trip: InstanceType<typeof Trip>, userId: string, role: string) => {
  if (role !== 'manager') return { authorized: true };

  const manager = await Manager.findOne({ userId });
  const managerBranchId = manager?.assignedBranchId?.toString();
  if (managerBranchId !== trip.branchId.toString()) {
    return { authorized: false, message: 'You are not authorized to reassign this trip' };
  }
  return { authorized: true };
};

export const reassignTripHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId, vehicleId, reason } = req.body;

    if (!driverId || !vehicleId) {
      return sendError(res, 400, 'driverId and vehicleId are required');
    }

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (trip.status !== 'scheduled') {
      return sendError(res, 400, `Only a scheduled trip can be reassigned (this one is ${trip.status})`);
    }

    const authCheck = await assertCanReassign(trip, req.user!.id, req.user!.role);
    if (!authCheck.authorized) {
      return sendError(res, 403, authCheck.message!);
    }

    const driver = await Driver.findById(driverId);
    if (!driver || driver.status !== 'active') {
      return sendError(res, 400, 'Driver must be active to be assigned a trip');
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== 'active') {
      return sendError(res, 400, 'Vehicle must be active to be assigned a trip');
    }

    const conflictingDriverTrip = await findConflictingTrip('driverId', driverId, trip._id.toString());
    if (conflictingDriverTrip) {
      return sendError(res, 400, `Driver is already assigned to trip ${conflictingDriverTrip.tripNumber}`);
    }

    const conflictingVehicleTrip = await findConflictingTrip('vehicleId', vehicleId, trip._id.toString());
    if (conflictingVehicleTrip) {
      return sendError(res, 400, `Vehicle is already assigned to trip ${conflictingVehicleTrip.tripNumber}`);
    }

    const previousDriverId = trip.driverId.toString();

    trip.driverId = driverId;
    trip.vehicleId = vehicleId;
    trip.reassignmentReason = reason || undefined;
    await trip.save();

    if (previousDriverId !== driverId) {
      emitToDriver(previousDriverId, 'tripUnassigned', {
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        reason,
      });
    }

    emitToDriver(driverId, 'tripAssigned', {
      tripId: trip._id,
      tripNumber: trip.tripNumber,
      pickupAddress: trip.pickupLocation.address,
      dropoffAddress: trip.dropoffLocation.address,
      estimatedEndTime: trip.estimatedEndTime,
      fare: trip.fare,
    });

    return sendSuccess(res, 200, 'Trip reassigned', { trip });
  } catch (error) {
    logger.error('Reassign trip error', { error });
    return sendError(res, 500, 'Failed to reassign trip');
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
    const { driverId, branchId, visibleToBranchId, status, deleted } = req.query;
    // Trip history (deleted=true) is its own separate view, not just another status - a
    // soft-deleted trip's original status still matters for context, so it isn't a status
    // filter value. Trips created before this field existed have no isDeleted at all, so
    // "not deleted" has to mean "not exactly true" rather than "exactly false".
    const filter: Record<string, unknown> = { isDeleted: deleted === 'true' ? true : { $ne: true } };
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

    const nameMap = await resolveApproverNames(trips.map((t) => t.deletedBy));
    const tripsWithNames = trips.map((t) => ({
      ...t.toObject(),
      deletedByName: approverDisplayName(t.deletedBy, nameMap),
    }));

    return sendSuccess(res, 200, 'Trips retrieved', { trips: tripsWithNames, count: trips.length });
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

    if (status === 'completed') {
      return sendError(res, 400, 'Use POST /trips/:tripId/complete with a proof-of-delivery photo instead');
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
    }

    const update: Record<string, unknown> = { status };
    if (tripStartTime) update.tripStartTime = new Date(tripStartTime);
    if (tripEndTime) update.tripEndTime = new Date(tripEndTime);
    if (fuelUsed !== undefined) update.fuelUsed = fuelUsed;

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.tripId, update, { new: true });

    return sendSuccess(res, 200, 'Trip status updated', { trip: updatedTrip });
  } catch (error) {
    logger.error('Update trip status error', { error });
    return sendError(res, 500, 'Failed to update trip status');
  }
};

export const completeTripWithPhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    const authCheck = await assertCanMarkReceived(trip, req.user!.id, req.user!.role);
    if (!authCheck.authorized) {
      return sendError(res, 403, authCheck.message!);
    }

    if (trip.status !== 'in_transit') {
      return sendError(res, 400, `This trip is ${trip.status}, not in transit`);
    }

    const file = req.file;
    if (!file) {
      return sendError(res, 400, 'A proof-of-delivery photo is required to mark this trip as received');
    }

    const { url } = await uploadFile(file.buffer, file.originalname, file.mimetype, 'proof-of-delivery');

    trip.status = 'completed';
    trip.tripEndTime = new Date();
    trip.proofOfDeliveryPhotoUrl = url;
    await trip.save();

    await Driver.findByIdAndUpdate(trip.driverId, {
      $inc: { totalTrips: 1, completedTrips: 1, totalEarnings: trip.fare },
    });

    return sendSuccess(res, 200, 'Trip marked as received', { trip });
  } catch (error) {
    logger.error('Complete trip with photo error', { error });
    return sendError(res, 500, 'Failed to mark trip as received');
  }
};

export const deleteTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.tripId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: req.user!.id },
      { new: true }
    );
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }
    return sendSuccess(res, 200, 'Trip deleted', { trip });
  } catch (error) {
    logger.error('Delete trip error', { error });
    return sendError(res, 500, 'Failed to delete trip');
  }
};

export const restoreTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.tripId,
      { isDeleted: false, $unset: { deletedAt: '', deletedBy: '' } },
      { new: true }
    );
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }
    return sendSuccess(res, 200, 'Trip restored', { trip });
  } catch (error) {
    logger.error('Restore trip error', { error });
    return sendError(res, 500, 'Failed to restore trip');
  }
};
