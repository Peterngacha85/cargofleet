import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  amount: number;
  method: 'cash' | 'mpesa';
  note?: string;
  // String, not ObjectId ref: a super admin (env-based "super_admin_N" id, not a User document)
  // can record a payment too, same pattern as Driver.approvedBy.
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'mpesa'], required: true },
    note: { type: String },
    recordedBy: { type: String, required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ driverId: 1, createdAt: -1 });

export default model<IPayment>('Payment', paymentSchema);
