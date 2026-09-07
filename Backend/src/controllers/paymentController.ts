import { Response } from 'express';
import Payment from '../models/Payment';
import Driver from '../models/Driver';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const recordPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId, amount, method, note } = req.body;

    if (!driverId || !amount || !method) {
      return sendError(res, 400, 'driverId, amount, and method are required');
    }
    if (Number(amount) <= 0) {
      return sendError(res, 400, 'amount must be greater than 0');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    const payment = await Payment.create({
      driverId,
      amount,
      method,
      note,
      recordedBy: req.user!.id,
    });

    driver.totalPaid += Number(amount);
    await driver.save();

    return sendSuccess(res, 201, 'Payment recorded', { payment, totalPaid: driver.totalPaid });
  } catch (error) {
    logger.error('Record payment error', { error });
    return sendError(res, 500, 'Failed to record payment');
  }
};

export const listPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driverId } = req.query;
    const filter: Record<string, unknown> = {};
    if (driverId) filter.driverId = driverId;

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    const nameMap = await resolveApproverNames(payments.map((p) => p.recordedBy));
    const paymentsWithNames = payments.map((p) => ({
      ...p.toObject(),
      recordedByName: approverDisplayName(p.recordedBy, nameMap),
    }));

    return sendSuccess(res, 200, 'Payments retrieved', { payments: paymentsWithNames, count: payments.length });
  } catch (error) {
    logger.error('List payments error', { error });
    return sendError(res, 500, 'Failed to retrieve payments');
  }
};
