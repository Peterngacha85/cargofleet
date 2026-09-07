import { Schema, model, Document, Types } from 'mongoose';
import { TripStatus } from '../types';

export interface ITripLocation {
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
  // Auto-detected from dropoffLocation coordinates (nearest branch) at creation time -
  // the goods may be heading to a different branch than the one that scheduled the trip.
  destinationBranchId?: Types.ObjectId;
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
  // Set whenever a manager/admin swaps the assigned driver on a still-scheduled trip - e.g.
  // the original driver went unreachable or otherwise never started it.
  reassignmentReason?: string;
  // Set by the destination manager when marking the trip received - proof the goods arrived.
  proofOfDeliveryPhotoUrl?: string;
  // Opaque, unguessable tokens for the two public (no-login) pages a customer can open -
  // generated once at trip creation. A manager/admin sees these on the trip itself (to build
  // a shareable link); the public endpoints below are the only unauthenticated way to use one.
  publicTrackingToken?: string;
  publicRatingToken?: string;
  ratingSubmittedAt?: Date;
  // Soft-deleted trips stay in the database (a "trip history") instead of being erased -
  // only a super admin can delete or restore one.
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
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
    destinationBranchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
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
    proofOfDeliveryPhotoUrl: { type: String },
    publicTrackingToken: { type: String, index: true, sparse: true },
    publicRatingToken: { type: String, index: true, sparse: true },
    ratingSubmittedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // String, not ObjectId ref: only a super admin (env-based id, not a User document) can
    // delete a trip.
    deletedBy: { type: String },
  },
  { timestamps: true }
);

tripSchema.index({ driverId: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ branchId: 1 });
tripSchema.index({ destinationBranchId: 1 });
tripSchema.index({ createdAt: -1 });
tripSchema.index({ isDeleted: 1 });

export default model<ITrip>('Trip', tripSchema);
