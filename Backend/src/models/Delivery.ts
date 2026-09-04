import { Schema, model, Document, Types } from 'mongoose';
import { DeliveryStatus, ItemCondition } from '../types';

export interface IDelivery extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  deliveryNumber: string;
  description: string;
  quantity: number;
  weight: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: DeliveryStatus;
  condition: {
    initial: ItemCondition;
    final: ItemCondition;
  };
  proofOfDeliveryPhoto?: Types.ObjectId;
  customerSignatureRequired: boolean;
  signatureProvided?: boolean;
  deliveredAt?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    deliveryNumber: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0 },
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'failed', 'returned'],
      default: 'pending',
    },
    condition: {
      initial: { type: String, enum: ['good', 'damaged', 'not_inspected'], default: 'not_inspected' },
      final: { type: String, enum: ['good', 'damaged', 'not_inspected'], default: 'not_inspected' },
    },
    proofOfDeliveryPhoto: { type: Schema.Types.ObjectId, ref: 'Photo' },
    customerSignatureRequired: { type: Boolean, default: false },
    signatureProvided: { type: Boolean },
    deliveredAt: { type: Date },
    failureReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

deliverySchema.index({ tripId: 1 });
deliverySchema.index({ status: 1 });

export default model<IDelivery>('Delivery', deliverySchema);
