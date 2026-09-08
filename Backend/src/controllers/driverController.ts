import { Request, Response } from 'express';
import Driver from '../models/Driver';
import Manager from '../models/Manager';
import User from '../models/User';
import Branch from '../models/Branch';
import Vehicle from '../models/Vehicle';
import DriverRating from '../models/DriverRating';
import Trip from '../models/Trip';
import Delivery from '../models/Delivery';
import {
  approveDriver,
  rejectDriver,
  assignVehicleToDriver,
  reassignDriverBranch,
  requestDriverDeletion,
  dismissDriverDeletionRequest,
  deleteDriver,
  restoreDriver,
} from '../services/driverService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';
import { emitToAdmins, emitToManagers } from '../websocket/emitters';

export const listDrivers = async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query;
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const drivers = await Driver.find(filter)
      .populate('userId', 'firstName lastName email phone profilePhoto')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    const approverMap = await resolveApproverNames(drivers.map((d) => d.approvedBy));
    const driversWithApprover = drivers.map((d) => ({
      ...d.toObject(),
      approvedByName: approverDisplayName(d.approvedBy, approverMap),
    }));

    return sendSuccess(res, 200, 'Drivers retrieved', { drivers: driversWithApprover, count: drivers.length });
  } catch (error) {
    logger.error('List drivers error', { error });
    return sendError(res, 500, 'Failed to retrieve drivers');
  }
};

export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.driverId).populate('userId', 'firstName lastName email phone');
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }
    return sendSuccess(res, 200, 'Driver retrieved', { driver });
  } catch (error) {
    logger.error('Get driver profile error', { error });
    return sendError(res, 500, 'Failed to retrieve driver');
  }
};

export const getPendingApprovalDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await Driver.find({ status: 'pending_approval', isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Pending drivers retrieved', { drivers, count: drivers.length });
  } catch (error) {
    logger.error('Get pending drivers error', { error });
    return sendError(res, 500, 'Failed to retrieve pending drivers');
  }
};

export const approveDriverHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    const { approvalReason, branchId } = req.body;
    const reviewerId = req.user!.id;

    if (!branchId) {
      return sendError(res, 400, 'branchId is required to approve a driver');
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return sendError(res, 404, 'Branch not found');
    }

    const driver = await approveDriver(driverId, reviewerId, branchId, approvalReason);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    return sendSuccess(res, 200, 'Driver approved successfully', { driver });
  } catch (error) {
    logger.error('Approve driver error', { error });
    return sendError(res, 500, 'Failed to approve driver');
  }
};

export const rejectDriverHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    const { rejectionReason } = req.body;
    const reviewerId = req.user!.id;

    if (!rejectionReason) {
      return sendError(res, 400, 'rejectionReason is required');
    }

    const driver = await rejectDriver(driverId, reviewerId, rejectionReason);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    return sendSuccess(res, 200, 'Driver registration rejected', { driver });
  } catch (error) {
    logger.error('Reject driver error', { error });
    return sendError(res, 500, 'Failed to reject driver');
  }
};

export const reassignBranchHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    const { branchId } = req.body;

    if (!branchId) {
      return sendError(res, 400, 'branchId is required');
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return sendError(res, 404, 'Branch not found');
    }

    const driver = await reassignDriverBranch(driverId, branchId);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    return sendSuccess(res, 200, 'Driver reassigned to new branch', { driver });
  } catch (error) {
    logger.error('Reassign driver branch error', { error });
    return sendError(res, 500, 'Failed to reassign driver');
  }
};

export const assignVehicleHandler = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return sendError(res, 400, 'vehicleId is required');
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }
    if (vehicle.status !== 'active') {
      return sendError(res, 400, 'Vehicle must be verified and active before it can be assigned', {
        status: vehicle.status,
      });
    }

    const driver = await assignVehicleToDriver(driverId, vehicleId);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    return sendSuccess(res, 200, 'Vehicle assigned to driver', { driver });
  } catch (error) {
    logger.error('Assign vehicle error', { error });
    return sendError(res, 500, 'Failed to assign vehicle');
  }
};

export const getDriverRatings = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const ratings = await DriverRating.find({ driverId }).sort({ createdAt: -1 });
    const driver = await Driver.findById(driverId);

    const distribution: Record<number, number> = {};
    ratings.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return sendSuccess(res, 200, 'Driver ratings retrieved', {
      ratings,
      avgRating: driver?.avgRating ?? 0,
      totalRatings: ratings.length,
      ratingDistribution: distribution,
    });
  } catch (error) {
    logger.error('Get driver ratings error', { error });
    return sendError(res, 500, 'Failed to retrieve ratings');
  }
};

export const getPendingDeletionDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await Driver.find({ deletionRequested: true })
      .populate('userId', 'firstName lastName email phone')
      .populate('branchId', 'name')
      .sort({ deletionRequestedAt: -1 });

    const requesterMap = await resolveApproverNames(drivers.map((d) => d.deletionRequestedBy));
    const driversWithRequester = drivers.map((d) => ({
      ...d.toObject(),
      deletionRequestedByName: approverDisplayName(d.deletionRequestedBy, requesterMap),
    }));

    return sendSuccess(res, 200, 'Pending deletion requests retrieved', {
      drivers: driversWithRequester,
      count: drivers.length,
    });
  } catch (error) {
    logger.error('Get pending deletion drivers error', { error });
    return sendError(res, 500, 'Failed to retrieve pending deletion requests');
  }
};

export const requestDriverDeletionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, 400, 'reason is required to request deletion');
    }

    const driver = await Driver.findById(driverId).populate('userId', 'firstName lastName');
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    const manager = await Manager.findOne({ userId: req.user!.id });
    if (!manager?.assignedBranchId || manager.assignedBranchId.toString() !== driver.branchId?.toString()) {
      return sendError(res, 403, 'You can only request deletion of drivers in your own branch');
    }

    const updated = await requestDriverDeletion(driverId, req.user!.id, reason);
    const requesterUser = await User.findById(req.user!.id).select('firstName lastName');

    const driverUser = driver.userId as unknown as { firstName?: string; lastName?: string };
    emitToAdmins('driverDeletionRequested', {
      driverId,
      driverName: `${driverUser?.firstName ?? ''} ${driverUser?.lastName ?? ''}`.trim(),
      requestedByName: `${requesterUser?.firstName ?? ''} ${requesterUser?.lastName ?? ''}`.trim(),
      reason,
    });

    return sendSuccess(res, 200, 'Deletion requested - a super admin will review it', { driver: updated });
  } catch (error) {
    logger.error('Request driver deletion error', { error });
    return sendError(res, 500, 'Failed to request driver deletion');
  }
};

export const dismissDriverDeletionRequestHandler = async (req: Request, res: Response) => {
  try {
    const driver = await dismissDriverDeletionRequest(req.params.driverId);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }
    return sendSuccess(res, 200, 'Deletion request dismissed', { driver });
  } catch (error) {
    logger.error('Dismiss driver deletion request error', { error });
    return sendError(res, 500, 'Failed to dismiss deletion request');
  }
};

export const deleteDriverHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.params;

    const hasActiveTrip = await Trip.exists({ driverId, status: { $in: ['scheduled', 'in_transit'] } });
    if (hasActiveTrip) {
      return sendError(res, 400, "Reassign or complete this driver's active trips before deleting them.");
    }

    const driver = await deleteDriver(driverId, req.user!.id);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    emitToManagers('driverDeleted', { driverId });
    emitToAdmins('driverDeleted', { driverId });

    return sendSuccess(res, 200, 'Driver deleted', { driver });
  } catch (error) {
    logger.error('Delete driver error', { error });
    return sendError(res, 500, 'Failed to delete driver');
  }
};

export const restoreDriverHandler = async (req: Request, res: Response) => {
  try {
    const driver = await restoreDriver(req.params.driverId);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }
    return sendSuccess(res, 200, 'Driver restored', { driver });
  } catch (error) {
    logger.error('Restore driver error', { error });
    return sendError(res, 500, 'Failed to restore driver');
  }
};

export const getDriverPerformance = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const completedTrips = await Trip.find({
      driverId,
      status: 'completed',
      isDeleted: { $ne: true },
    }).select('tripEndTime estimatedEndTime deliveryItems');

    const totalCompletedTrips = completedTrips.length;
    // A trip with no recorded tripEndTime (shouldn't happen once completed, but the field is
    // optional on the schema) can't be judged on-time either way - excluded from both sides
    // of the ratio rather than silently counted as late.
    const judgeable = completedTrips.filter((t) => t.tripEndTime);
    const onTimeCount = judgeable.filter((t) => t.tripEndTime! <= t.estimatedEndTime).length;
    const onTimePercentage = judgeable.length > 0 ? Math.round((onTimeCount / judgeable.length) * 1000) / 10 : 0;

    const deliveryItemIds = completedTrips.flatMap((t) => t.deliveryItems);
    const damageIncidents = await Delivery.countDocuments({
      _id: { $in: deliveryItemIds },
      'condition.final': 'damaged',
    });

    return sendSuccess(res, 200, 'Driver performance retrieved', {
      totalCompletedTrips,
      onTimeCount,
      onTimePercentage,
      damageIncidents,
    });
  } catch (error) {
    logger.error('Get driver performance error', { error });
    return sendError(res, 500, 'Failed to retrieve driver performance');
  }
};
