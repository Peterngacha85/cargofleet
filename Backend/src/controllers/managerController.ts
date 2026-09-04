import { Response } from 'express';
import Manager from '../models/Manager';
import Branch from '../models/Branch';
import Approval from '../models/Approval';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { resolveApproverNames, approverDisplayName } from '../utils/resolveApprover';

export const listManagers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, branchId } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (branchId) filter.assignedBranchId = branchId;

    const managers = await Manager.find(filter)
      .populate('userId', 'firstName lastName email phone profilePhoto')
      .populate('assignedBranchId', 'name')
      .sort({ createdAt: -1 });

    const verifierMap = await resolveApproverNames(managers.map((m) => m.verifiedBy));
    const managersWithVerifier = managers.map((m) => ({
      ...m.toObject(),
      verifiedByName: approverDisplayName(m.verifiedBy, verifierMap),
    }));

    return sendSuccess(res, 200, 'Managers retrieved', { managers: managersWithVerifier, count: managers.length });
  } catch (error) {
    logger.error('List managers error', { error });
    return sendError(res, 500, 'Failed to retrieve managers');
  }
};

export const getPendingVerificationManagers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const managers = await Manager.find({ status: 'pending_verification' })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Pending managers retrieved', { managers, count: managers.length });
  } catch (error) {
    logger.error('Get pending managers error', { error });
    return sendError(res, 500, 'Failed to retrieve pending managers');
  }
};

export const verifyManagerHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { managerId } = req.params;
    const { branchId, verificationReason } = req.body;
    const reviewerId = req.user!.id;

    if (!branchId) {
      return sendError(res, 400, 'branchId is required to verify a manager');
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return sendError(res, 404, 'Branch not found');
    }

    const manager = await Manager.findByIdAndUpdate(
      managerId,
      {
        status: 'active',
        assignedBranchId: branchId,
        verifiedBy: reviewerId,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!manager) {
      return sendError(res, 404, 'Manager not found');
    }

    await Branch.findByIdAndUpdate(branchId, { $addToSet: { managerIds: manager._id } });

    await Approval.create({
      approvableId: manager._id,
      approvableType: 'manager',
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      approvalReason: verificationReason,
    });

    return sendSuccess(res, 200, 'Manager verified and assigned to branch', { manager });
  } catch (error) {
    logger.error('Verify manager error', { error });
    return sendError(res, 500, 'Failed to verify manager');
  }
};

export const rejectManagerHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { managerId } = req.params;
    const { rejectionReason } = req.body;
    const reviewerId = req.user!.id;

    const manager = await Manager.findByIdAndUpdate(
      managerId,
      { status: 'rejected', rejectionReason },
      { new: true }
    );

    if (!manager) {
      return sendError(res, 404, 'Manager not found');
    }

    await Approval.create({
      approvableId: manager._id,
      approvableType: 'manager',
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason,
    });

    return sendSuccess(res, 200, 'Manager registration rejected', { manager });
  } catch (error) {
    logger.error('Reject manager error', { error });
    return sendError(res, 500, 'Failed to reject manager');
  }
};
