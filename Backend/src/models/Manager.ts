import { Schema, model, Document, Types } from 'mongoose';
import { ManagerStatus } from '../types';

export interface IManager extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: ManagerStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  assignedBranchId?: Types.ObjectId;
  totalDriversManaged: number;
  totalTripsOverseen: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const managerSchema = new Schema<IManager>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'rejected', 'inactive'],
      default: 'pending_verification',
    },
    rejectionReason: { type: String },
    // String, not ObjectId ref: managers are always verified by a super admin (env-based id, not a User document)
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    assignedBranchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    totalDriversManaged: { type: Number, default: 0, min: 0 },
    totalTripsOverseen: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String },
  },
  { timestamps: true }
);

managerSchema.index({ status: 1 });
managerSchema.index({ assignedBranchId: 1 });
managerSchema.index({ createdAt: -1 });

export default model<IManager>('Manager', managerSchema);
