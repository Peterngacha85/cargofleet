import { Request, Response } from 'express';
import Branch from '../models/Branch';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const listBranches = async (_req: Request, res: Response) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    return sendSuccess(res, 200, 'Branches retrieved', { branches, count: branches.length });
  } catch (error) {
    logger.error('List branches error', { error });
    return sendError(res, 500, 'Failed to retrieve branches');
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, city, latitude, longitude, address, phone } = req.body;

    if (!name || !city || latitude === undefined || longitude === undefined || !address || !phone) {
      return sendError(res, 400, 'Missing required fields');
    }

    const existing = await Branch.findOne({ name });
    if (existing) {
      return sendError(res, 409, 'Branch name already exists', { name: 'Already in use' });
    }

    const branch = await Branch.create({ name, city, latitude, longitude, address, phone });
    return sendSuccess(res, 201, 'Branch created', { branch });
  } catch (error) {
    logger.error('Create branch error', { error });
    return sendError(res, 500, 'Failed to create branch');
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.branchId, req.body, { new: true });
    if (!branch) {
      return sendError(res, 404, 'Branch not found');
    }
    return sendSuccess(res, 200, 'Branch updated', { branch });
  } catch (error) {
    logger.error('Update branch error', { error });
    return sendError(res, 500, 'Failed to update branch');
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.branchId);
    if (!branch) {
      return sendError(res, 404, 'Branch not found');
    }
    return sendSuccess(res, 200, 'Branch deleted', { branchId: req.params.branchId });
  } catch (error) {
    logger.error('Delete branch error', { error });
    return sendError(res, 500, 'Failed to delete branch');
  }
};
