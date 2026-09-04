import { Schema, model, Document, Types } from 'mongoose';
import { ApprovableType, ApprovalStatus } from '../types';

export interface IApproval extends Document {
  _id: Types.ObjectId;
  approvableId: Types.ObjectId;
  approvableType: ApprovableType;
  status: ApprovalStatus;
  reviewedAt?: Date;
  reviewedBy: string;
  approvalReason?: string;
  rejectionReason?: string;
  comments?: string;
  additionalInfo?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const approvalSchema = new Schema<IApproval>(
  {
    approvableId: { type: Schema.Types.ObjectId, required: true },
    approvableType: { type: String, enum: ['driver', 'manager'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedAt: { type: Date },
    // String, not ObjectId ref: the reviewer may be a manager (User _id) or a super admin (env-based id)
    reviewedBy: { type: String, required: true },
    approvalReason: { type: String },
    rejectionReason: { type: String },
    comments: { type: String },
    additionalInfo: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

approvalSchema.index({ approvableId: 1 });
approvalSchema.index({ approvableType: 1, status: 1 });
approvalSchema.index({ reviewedBy: 1 });
approvalSchema.index({ createdAt: -1 });

export default model<IApproval>('Approval', approvalSchema);
