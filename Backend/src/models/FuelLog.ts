import { Schema, model, Document, Types } from 'mongoose';

export interface IFuelLog extends Document {
  _id: Types.ObjectId;
  vehicleId: Types.ObjectId;
  tripId?: Types.ObjectId;
  driverId: Types.ObjectId;
  liters: number;
  cost: number;
  odometerReading?: number;
  receiptPhotoUrl?: string;
  // String, not ObjectId ref: a super admin (env-based "super_admin_N" id, not a User
  // document) can log fuel too, same pattern as Driver.approvedBy.
  loggedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const fuelLogSchema = new Schema<IFuelLog>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    liters: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    odometerReading: { type: Number, min: 0 },
    receiptPhotoUrl: { type: String },
    loggedBy: { type: String, required: true },
  },
  { timestamps: true }
);

fuelLogSchema.index({ vehicleId: 1, createdAt: -1 });
fuelLogSchema.index({ tripId: 1 });

export default model<IFuelLog>('FuelLog', fuelLogSchema);
