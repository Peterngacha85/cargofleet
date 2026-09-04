import { Schema, model, Document, Types } from 'mongoose';
import { PhotoType, ArchiveStatus } from '../types';

export interface IPhoto extends Document {
  _id: Types.ObjectId;
  deliveryId: Types.ObjectId;
  tripId: Types.ObjectId;
  driverId: Types.ObjectId;
  photoType: PhotoType;
  cloudflareUrl: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  approvedBy?: string;
  approvedAt?: Date;
  archiveStatus: ArchiveStatus;
  archiveReason?: string;
  scheduledDeleteAt?: Date;
  metadata: {
    filename: string;
    size: number;
    mimeType: string;
    exifData?: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    photoType: {
      type: String,
      enum: ['proof_of_delivery', 'damage_report', 'vehicle_condition'],
      required: true,
    },
    cloudflareUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // String, not ObjectId ref: photo approval is super-admin-only (env-based id, not a User document)
    approvedBy: { type: String },
    approvedAt: { type: Date },
    archiveStatus: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    archiveReason: { type: String },
    scheduledDeleteAt: { type: Date },
    metadata: {
      filename: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      exifData: { type: Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

photoSchema.index({ deliveryId: 1 });
photoSchema.index({ tripId: 1 });
photoSchema.index({ driverId: 1 });
photoSchema.index({ uploadedAt: -1 });
photoSchema.index({ scheduledDeleteAt: 1 }, { sparse: true });

export default model<IPhoto>('Photo', photoSchema);
