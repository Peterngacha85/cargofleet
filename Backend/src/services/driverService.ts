import { Types } from 'mongoose';
import Driver from '../models/Driver';
import Branch from '../models/Branch';
import Vehicle from '../models/Vehicle';
import Approval from '../models/Approval';

export const approveDriver = async (
  driverId: string,
  reviewerId: string,
  branchId: string,
  approvalReason?: string
) => {
  const driver = await Driver.findByIdAndUpdate(
    driverId,
    {
      status: 'active',
      approvedBy: reviewerId,
      approvedAt: new Date(),
      branchId: new Types.ObjectId(branchId),
    },
    { new: true }
  );

  if (driver) {
    await Approval.create({
      approvableId: driver._id,
      approvableType: 'driver',
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      approvalReason,
    });
    await Branch.findByIdAndUpdate(branchId, { $inc: { driverCount: 1 } });
  }

  return driver;
};

export const rejectDriver = async (driverId: string, reviewerId: string, rejectionReason: string) => {
  const driver = await Driver.findByIdAndUpdate(
    driverId,
    { status: 'rejected', rejectionReason },
    { new: true }
  );

  if (driver) {
    await Approval.create({
      approvableId: driver._id,
      approvableType: 'driver',
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason,
    });
  }

  return driver;
};

export const reassignDriverBranch = async (driverId: string, newBranchId: string) => {
  const driver = await Driver.findById(driverId);
  if (!driver) return null;

  const oldBranchId = driver.branchId?.toString();
  if (oldBranchId === newBranchId) return driver;

  driver.branchId = new Types.ObjectId(newBranchId);
  await driver.save();

  if (oldBranchId) {
    await Branch.findByIdAndUpdate(oldBranchId, { $inc: { driverCount: -1 } });
  }
  await Branch.findByIdAndUpdate(newBranchId, { $inc: { driverCount: 1 } });

  return driver;
};

export const assignVehicleToDriver = async (driverId: string, vehicleId: string) => {
  const driver = await Driver.findByIdAndUpdate(
    driverId,
    { assignedVehicleId: new Types.ObjectId(vehicleId) },
    { new: true }
  );
  if (driver) {
    await Vehicle.findByIdAndUpdate(vehicleId, { currentDriverId: driver._id });
  }
  return driver;
};
