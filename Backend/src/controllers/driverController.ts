import { Request, Response } from 'express';
import Driver from '../models/Driver';
import Branch from '../models/Branch';
import Vehicle from '../models/Vehicle';
import DriverRating from '../models/DriverRating';
import { approveDriver, rejectDriver, assignVehicleToDriver, reassignDriverBranch } from '../services/driverService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';

export const listDrivers = async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query;
    const filter: Record<string, unknown> = {};
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
    const drivers = await Driver.find({ status: 'pending_approval' })
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
