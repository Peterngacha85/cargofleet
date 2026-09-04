import { Response } from 'express';
import Vehicle from '../models/Vehicle';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitToAdmins } from '../websocket/emitters';

export const listVehicles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { branchId, status, page = '1', limit = String(DEFAULT_PAGE_SIZE) } = req.query;

    const filter: Record<string, unknown> = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Vehicle.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Vehicles retrieved', {
      vehicles,
      count: vehicles.length,
      pagination: { page: pageNum, limit: limitNum, total },
    });
  } catch (error) {
    logger.error('List vehicles error', { error });
    return sendError(res, 500, 'Failed to retrieve vehicles');
  }
};

export const getPendingVerificationVehicles = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ status: 'pending_verification' })
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    // registeredBy is a plain string (not an ObjectId ref, since an admin can register a
    // vehicle directly with their env-based id too) so it can't use Mongoose's populate().
    // Every doc here is manager-created though (admin-created ones skip pending_verification
    // entirely), so registeredBy is always a real User id - look those up in one batch.
    const registrantIds = [...new Set(vehicles.map((v) => v.registeredBy))];
    const registrants = await User.find({ _id: { $in: registrantIds } }, 'firstName lastName email');
    const registrantMap = new Map(registrants.map((u) => [u._id.toString(), u]));

    const vehiclesWithRegistrant = vehicles.map((v) => ({
      ...v.toObject(),
      registeredBy: registrantMap.get(v.registeredBy) ?? v.registeredBy,
    }));

    return sendSuccess(res, 200, 'Pending vehicles retrieved', {
      vehicles: vehiclesWithRegistrant,
      count: vehicles.length,
    });
  } catch (error) {
    logger.error('Get pending vehicles error', { error });
    return sendError(res, 500, 'Failed to retrieve pending vehicles');
  }
};

export const getVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }
    return sendSuccess(res, 200, 'Vehicle retrieved', { vehicle });
  } catch (error) {
    logger.error('Get vehicle error', { error });
    return sendError(res, 500, 'Failed to retrieve vehicle');
  }
};

export const createVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { registrationNumber, vehicleType, make, model, year, capacity, branchId, fuelType } = req.body;

    if (!registrationNumber || !vehicleType || !make || !model || !year || !capacity || !branchId || !fuelType) {
      return sendError(res, 400, 'Missing required fields');
    }

    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return sendError(res, 409, 'Registration number already exists');
    }

    // An admin registering a vehicle themselves needs no further verification;
    // a manager's vehicle sits pending until a super admin verifies it.
    const isAdmin = req.user!.role === 'admin';

    const vehicle = await Vehicle.create({
      registrationNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      branchId,
      fuelType,
      registeredBy: req.user!.id,
      status: isAdmin ? 'active' : 'pending_verification',
    });

    if (!isAdmin) {
      emitToAdmins('newVehicleRegistration', {
        vehicleId: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        createdAt: vehicle.createdAt,
      });
    }

    return sendSuccess(res, 201, 'Vehicle created', { vehicle });
  } catch (error) {
    logger.error('Create vehicle error', { error });
    return sendError(res, 500, 'Failed to create vehicle');
  }
};

export const updateVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.vehicleId, req.body, { new: true });
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }
    return sendSuccess(res, 200, 'Vehicle updated', { vehicle });
  } catch (error) {
    logger.error('Update vehicle error', { error });
    return sendError(res, 500, 'Failed to update vehicle');
  }
};

export const verifyVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.vehicleId,
      { status: 'active', verifiedBy: req.user!.id, verifiedAt: new Date() },
      { new: true }
    );
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }
    return sendSuccess(res, 200, 'Vehicle verified', { vehicle });
  } catch (error) {
    logger.error('Verify vehicle error', { error });
    return sendError(res, 500, 'Failed to verify vehicle');
  }
};

export const rejectVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return sendError(res, 400, 'rejectionReason is required');
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.vehicleId,
      { status: 'rejected', verifiedBy: req.user!.id, verifiedAt: new Date(), rejectionReason },
      { new: true }
    );
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }
    return sendSuccess(res, 200, 'Vehicle registration rejected', { vehicle });
  } catch (error) {
    logger.error('Reject vehicle error', { error });
    return sendError(res, 500, 'Failed to reject vehicle');
  }
};
