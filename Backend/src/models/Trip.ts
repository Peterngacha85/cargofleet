import { Schema, model, Document, Types } from 'mongoose';
import { TripStatus } from '../types';

interface ITripLocation {
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
}

export interface ITrip extends Document {
  _id: Types.ObjectId;
  tripNumber: string;
  driverId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  branchId: Types.ObjectId;
  pickupLocation: ITripLocation;
  dropoffLocation: ITripLocation;
  status: TripStatus;
  deliveryItems: Types.ObjectId[];
  tripStartTime?: Date;
  tripEndTime?: Date;
  estimatedEndTime: Date;
  distance: number;
  fuelUsed?: number;
  expenses: number;
  fare: number;
  totalEarnings: number;
  driverComment?: string;
  managerComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tripLocationSchema = new Schema<ITripLocation>(
  {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
  },
  { _id: false }
);

const tripSchema = new Schema<ITrip>(
  {
    tripNumber: { type: String, required: true, unique: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    pickupLocation: { type: tripLocationSchema, required: true },
    dropoffLocation: { type: tripLocationSchema, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'in_transit', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    deliveryItems: [{ type: Schema.Types.ObjectId, ref: 'Delivery' }],
    tripStartTime: { type: Date },
    tripEndTime: { type: Date },
    estimatedEndTime: { type: Date, required: true },
    distance: { type: Number, default: 0 },
    fuelUsed: { type: Number },
    expenses: { type: Number, default: 0 },
    fare: { type: Number, required: true },
    totalEarnings: { type: Number, default: 0 },
    driverComment: { type: String },
    managerComment: { type: String },
  },
  { timestamps: true }
);

tripSchema.index({ driverId: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ branchId: 1 });
tripSchema.index({ createdAt: -1 });

export default model<ITrip>('Trip', tripSchema);
