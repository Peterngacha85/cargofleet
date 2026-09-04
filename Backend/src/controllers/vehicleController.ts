import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import { logger } from '../utils/logger';

export const listVehicles = async (req: Request, res: Response) => {
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

export const getVehicle = async (req: Request, res: Response) => {
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

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { registrationNumber, vehicleType, make, model, year, capacity, branchId, fuelType } = req.body;

    if (!registrationNumber || !vehicleType || !make || !model || !year || !capacity || !branchId || !fuelType) {
      return sendError(res, 400, 'Missing required fields');
    }

    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) {
      return sendError(res, 409, 'Registration number already exists');
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      branchId,
      fuelType,
    });

    return sendSuccess(res, 201, 'Vehicle created', { vehicle });
  } catch (error) {
    logger.error('Create vehicle error', { error });
    return sendError(res, 500, 'Failed to create vehicle');
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
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
