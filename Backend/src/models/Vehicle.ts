import { Schema, model, Document, Types } from 'mongoose';
import { VehicleType, VehicleStatus, FuelType } from '../types';

export interface IVehicle extends Omit<Document, 'model'> {
  _id: Types.ObjectId;
  registrationNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  capacity: number;
  currentDriverId?: Types.ObjectId;
  branchId: Types.ObjectId;
  status: VehicleStatus;
  registeredBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  maintenanceDue?: Date;
  fuelType: FuelType;
  lastServiceDate?: Date;
  totalTrips: number;
  totalKilometers: number;
  mileagePerLiter: number;
  documents: {
    insuranceExpiry: Date;
    registrationExpiry: Date;
    inspectionExpiry: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicleType: { type: String, enum: ['motorcycle', 'van', 'truck', 'lorry'], required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    capacity: { type: Number, required: true },
    currentDriverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'rejected', 'maintenance', 'retired'],
      default: 'pending_verification',
    },
    // String, not ObjectId ref: an admin can register a vehicle directly too, and their id
    // is an env-based "super_admin_N" string, not a User document.
    registeredBy: { type: String, required: true },
    // String, not ObjectId ref: the verifier is always a super admin (env-based id, not a User document)
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    maintenanceDue: { type: Date },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric'], required: true },
    lastServiceDate: { type: Date },
    totalTrips: { type: Number, default: 0 },
    totalKilometers: { type: Number, default: 0 },
    mileagePerLiter: { type: Number, default: 0 },
    documents: {
      insuranceExpiry: { type: Date },
      registrationExpiry: { type: Date },
      inspectionExpiry: { type: Date },
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ currentDriverId: 1 });
vehicleSchema.index({ branchId: 1 });
vehicleSchema.index({ status: 1 });

export default model<IVehicle>('Vehicle', vehicleSchema);
