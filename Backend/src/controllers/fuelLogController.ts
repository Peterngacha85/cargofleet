import { Response } from 'express';
import FuelLog from '../models/FuelLog';
import { uploadFile } from '../services/fileService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const logFuel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vehicleId, tripId, driverId, liters, cost, odometerReading } = req.body;

    if (!vehicleId || !driverId || !liters || !cost) {
      return sendError(res, 400, 'vehicleId, driverId, liters, and cost are required');
    }

    let receiptPhotoUrl: string | undefined;
    if (req.file) {
      const { url } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'fuel-receipts');
      receiptPhotoUrl = url;
    }

    const fuelLog = await FuelLog.create({
      vehicleId,
      tripId: tripId || undefined,
      driverId,
      liters,
      cost,
      odometerReading: odometerReading || undefined,
      receiptPhotoUrl,
      loggedBy: req.user!.id,
    });

    return sendSuccess(res, 201, 'Fuel logged', { fuelLog });
  } catch (error) {
    logger.error('Log fuel error', { error });
    return sendError(res, 500, 'Failed to log fuel');
  }
};

export const listFuelLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vehicleId, tripId } = req.query;
    const filter: Record<string, unknown> = {};
    if (vehicleId) filter.vehicleId = vehicleId;
    if (tripId) filter.tripId = tripId;

    const fuelLogs = await FuelLog.find(filter).sort({ createdAt: -1 });
    const totals = fuelLogs.reduce(
      (acc, f) => ({ liters: acc.liters + f.liters, cost: acc.cost + f.cost }),
      { liters: 0, cost: 0 }
    );

    return sendSuccess(res, 200, 'Fuel logs retrieved', { fuelLogs, count: fuelLogs.length, totals });
  } catch (error) {
    logger.error('List fuel logs error', { error });
    return sendError(res, 500, 'Failed to retrieve fuel logs');
  }
};
