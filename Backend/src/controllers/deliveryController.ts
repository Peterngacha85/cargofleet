import { Request, Response } from 'express';
import Delivery from '../models/Delivery';
import Trip from '../models/Trip';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const generateDeliveryNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Delivery.countDocuments({});
  return `DEL-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createDelivery = async (req: Request, res: Response) => {
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

export const getDelivery = async (req: Request, res: Response) => {
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

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { status, failureReason, finalCondition } = req.body;

    if (!status) {
      return sendError(res, 400, 'status is required');
    }

    const update: Record<string, unknown> = { status };
    if (status === 'delivered') update.deliveredAt = new Date();
    if (failureReason) update.failureReason = failureReason;
    if (finalCondition) update['condition.final'] = finalCondition;

    const delivery = await Delivery.findByIdAndUpdate(req.params.deliveryId, update, { new: true });
    if (!delivery) {
      return sendError(res, 404, 'Delivery not found');
    }

    return sendSuccess(res, 200, 'Delivery status updated', { delivery });
  } catch (error) {
    logger.error('Update delivery status error', { error });
    return sendError(res, 500, 'Failed to update delivery status');
  }
};
