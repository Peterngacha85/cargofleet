import { Schema, model, Document, Types } from 'mongoose';
import { DriverStatus } from '../types';

export interface IDriver extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  drivingLicenseNumber: string;
  licenseExpiry: Date;
  licensePhotoUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: DriverStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  branchId?: Types.ObjectId;
  assignedVehicleId?: Types.ObjectId;
  totalTrips: number;
  completedTrips: number;
  avgRating: number;
  totalEarnings: number;
  totalPaid: number;
  advanceAmount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deletionRequested: boolean;
  deletionRequestedBy?: string;
  deletionRequestedAt?: Date;
  deletionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    drivingLicenseNumber: { type: String, required: true, unique: true },
    licenseExpiry: { type: Date, required: true },
    licensePhotoUrl: { type: String },
    // Not required: a Google OAuth sign-up can't supply these upfront (filled in later, same as phone on User).
    emergencyContactName: { type: String, default: '' },
    emergencyContactPhone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending_approval', 'active', 'rejected', 'suspended'],
      default: 'pending_approval',
    },
    rejectionReason: { type: String },
    // String, not ObjectId ref: the approver may be a super admin (env-based "super_admin_N" id, not a User document)
    approvedBy: { type: String },
    approvedAt: { type: Date },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    assignedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    totalTrips: { type: Number, default: 0, min: 0 },
    completedTrips: { type: Number, default: 0, min: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    // Soft-delete, same shape as Trip's isDeleted/deletedAt/deletedBy - keeps historical
    // references (trips, ratings, payments) intact rather than orphaning them.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    // A manager can flag a driver in their branch for removal, but only admin can actually
    // delete them - these fields hold the pending request until admin reviews it.
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedBy: { type: String },
    deletionRequestedAt: { type: Date },
    deletionReason: { type: String },
  },
  { timestamps: true }
);

driverSchema.index({ status: 1 });
driverSchema.index({ deletionRequested: 1 });
driverSchema.index({ branchId: 1 });
driverSchema.index({ assignedVehicleId: 1 });
driverSchema.index({ avgRating: -1 });
driverSchema.index({ createdAt: -1 });

export default model<IDriver>('Driver', driverSchema);
