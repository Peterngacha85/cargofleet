import { Response } from 'express';
import Delivery from '../models/Delivery';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const generateDeliveryNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Delivery.countDocuments({});
  return `DEL-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createDelivery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      tripId,
      description,
      quantity,
      weight,
      receiverName,
      receiverPhone,
      deliveryAddress,
      latitude,
      longitude,
      customerSignatureRequired,
    } = req.body;

    if (!tripId || !description || !quantity || !weight || !receiverName || !receiverPhone || !deliveryAddress) {
      return sendError(res, 400, 'Missing required fields');
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    const deliveryNumber = await generateDeliveryNumber();

    const delivery = await Delivery.create({
      tripId,
      deliveryNumber,
      description,
      quantity,
      weight,
      receiverName,
      receiverPhone,
      deliveryAddress,
      latitude,
      longitude,
      customerSignatureRequired: !!customerSignatureRequired,
    });

    await Trip.findByIdAndUpdate(tripId, { $push: { deliveryItems: delivery._id } });

    return sendSuccess(res, 201, 'Delivery created', { delivery });
  } catch (error) {
    logger.error('Create delivery error', { error });
    return sendError(res, 500, 'Failed to create delivery');
  }
};

export const getDelivery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId);
    if (!delivery) {
      return sendError(res, 404, 'Delivery not found');
    }
    return sendSuccess(res, 200, 'Delivery retrieved', { delivery });
  } catch (error) {
    logger.error('Get delivery error', { error });
    return sendError(res, 500, 'Failed to retrieve delivery');
  }
};

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, failureReason, finalCondition, proofOfDeliveryPhoto, signatureProvided } = req.body;

    if (!status) {
      return sendError(res, 400, 'status is required');
    }

    const delivery = await Delivery.findById(req.params.deliveryId);
    if (!delivery) {
      return sendError(res, 404, 'Delivery not found');
    }

    // A driver may only update items on their own trip - manager/admin aren't scoped this way
    // since they legitimately need to act on any delivery.
    if (req.user!.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user!.id });
      const trip = await Trip.findById(delivery.tripId).select('driverId');
      if (!driver || !trip || trip.driverId.toString() !== driver._id.toString()) {
        return sendError(res, 403, 'You are not authorized to update this delivery');
      }
    }

    delivery.status = status;
    if (status === 'delivered') delivery.deliveredAt = new Date();
    if (failureReason) delivery.failureReason = failureReason;
    if (finalCondition) delivery.condition.final = finalCondition;
    if (proofOfDeliveryPhoto) delivery.proofOfDeliveryPhoto = proofOfDeliveryPhoto;
    if (signatureProvided !== undefined) delivery.signatureProvided = !!signatureProvided;
    await delivery.save();

    return sendSuccess(res, 200, 'Delivery status updated', { delivery });
  } catch (error) {
    logger.error('Update delivery status error', { error });
    return sendError(res, 500, 'Failed to update delivery status');
  }
};
