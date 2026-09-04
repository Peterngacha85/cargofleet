import { Schema, model, Document, Types } from 'mongoose';

export interface IBranch extends Document {
  _id: Types.ObjectId;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  managerIds: Types.ObjectId[];
  vehicleCount: number;
  driverCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    managerIds: [{ type: Schema.Types.ObjectId, ref: 'Manager' }],
    vehicleCount: { type: Number, default: 0 },
    driverCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

branchSchema.index({ city: 1 });
branchSchema.index({ managerIds: 1 });

export default model<IBranch>('Branch', branchSchema);
