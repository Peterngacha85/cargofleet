import { Response } from 'express';
import Vehicle from '../models/Vehicle';
import User from '../models/User';
import Manager from '../models/Manager';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import { uploadFile } from '../services/fileService';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';
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
        .populate('branchId', 'name')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Vehicle.countDocuments(filter),
    ]);

    // registeredBy/verifiedBy are plain strings (not ObjectId refs) since either a manager
    // or an env-based super admin can hold them - can't use Mongoose's populate() for these.
    const nameMap = await resolveApproverNames(vehicles.flatMap((v) => [v.registeredBy, v.verifiedBy]));
    const vehiclesWithNames = vehicles.map((v) => ({
      ...v.toObject(),
      registeredByName: approverDisplayName(v.registeredBy, nameMap),
      verifiedByName: approverDisplayName(v.verifiedBy, nameMap),
    }));

    return sendSuccess(res, 200, 'Vehicles retrieved', {
      vehicles: vehiclesWithNames,
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
    const {
      registrationNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      branchId,
      fuelType,
      maintenanceDue,
      lastServiceDate,
      insuranceExpiry,
      registrationExpiry,
      inspectionExpiry,
    } = req.body;

    if (!registrationNumber || !vehicleType || !make || !model || !year || !capacity || !branchId || !fuelType) {
      return sendError(res, 400, 'Missing required fields');
    }
    if (!req.file) {
      return sendError(res, 400, 'A photo of the vehicle is required');
    }

    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return sendError(res, 409, 'Registration number already exists');
    }

    // An admin registering a vehicle themselves needs no further verification;
    // a manager's vehicle sits pending until a super admin verifies it.
    const isAdmin = req.user!.role === 'admin';
    const { url: photoUrl } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'vehicles');

    const vehicle = await Vehicle.create({
      registrationNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      branchId,
      fuelType,
      photoUrl,
      registeredBy: req.user!.id,
      status: isAdmin ? 'active' : 'pending_verification',
      maintenanceDue: maintenanceDue ? new Date(maintenanceDue) : undefined,
      lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : undefined,
      documents: {
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : undefined,
        inspectionExpiry: inspectionExpiry ? new Date(inspectionExpiry) : undefined,
      },
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
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    const isAdmin = req.user!.role === 'admin';
    if (!isAdmin) {
      const manager = await Manager.findOne({ userId: req.user!.id });
      if (!manager || manager.assignedBranchId?.toString() !== vehicle.branchId.toString()) {
        return sendError(res, 403, 'You can only edit vehicles registered to your own branch');
      }
    }

    // Only these fields are editable - registrationNumber/branchId/status etc. stay
    // out of reach of a plain field-by-field req.body pass-through.
    const {
      vehicleType,
      make,
      model,
      year,
      capacity,
      fuelType,
      maintenanceDue,
      lastServiceDate,
      insuranceExpiry,
      registrationExpiry,
      inspectionExpiry,
    } = req.body;
    if (vehicleType !== undefined) vehicle.vehicleType = vehicleType;
    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (capacity !== undefined) vehicle.capacity = capacity;
    if (fuelType !== undefined) vehicle.fuelType = fuelType;
    if (maintenanceDue !== undefined) vehicle.maintenanceDue = maintenanceDue ? new Date(maintenanceDue) : undefined;
    if (lastServiceDate !== undefined) vehicle.lastServiceDate = lastServiceDate ? new Date(lastServiceDate) : undefined;
    if (insuranceExpiry !== undefined) vehicle.documents.insuranceExpiry = new Date(insuranceExpiry);
    if (registrationExpiry !== undefined) vehicle.documents.registrationExpiry = new Date(registrationExpiry);
    if (inspectionExpiry !== undefined) vehicle.documents.inspectionExpiry = new Date(inspectionExpiry);

    if (req.file) {
      const { url } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'vehicles');
      vehicle.photoUrl = url;
    }

    // A manager editing their vehicle's details sends it back for re-verification - an
    // admin editing (they're the verifying authority) leaves its current status alone.
    if (!isAdmin) {
      vehicle.status = 'pending_verification';
      vehicle.verifiedBy = undefined;
      vehicle.verifiedAt = undefined;
      vehicle.rejectionReason = undefined;
    }

    await vehicle.save();

    if (!isAdmin) {
      emitToAdmins('newVehicleRegistration', {
        vehicleId: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        createdAt: vehicle.createdAt,
      });
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
