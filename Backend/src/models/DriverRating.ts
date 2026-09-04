import { Schema, model, Document, Types } from 'mongoose';
import { RatedByType, QualityRating, TimelinessRating } from '../types';

export interface IDriverRating extends Document {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  tripId: Types.ObjectId;
  rating: number;
  ratedBy: RatedByType;
  ratedByUserId: Types.ObjectId;
  comment: string;
  positiveAspects?: string[];
  negativeAspects?: string[];
  deliveryQuality: QualityRating;
  timeliness: TimelinessRating;
  professionalism: QualityRating;
  ratingImpact: {
    deductionPercentage: number;
    bonusPercentage: number;
    tripEarnings: number;
    adjustedEarnings: number;
  };
  customerName?: string;
  customerPhone?: string;
  customerSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const driverRatingSchema = new Schema<IDriverRating>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    ratedBy: { type: String, enum: ['manager', 'customer'], required: true },
    ratedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, default: '' },
    positiveAspects: [{ type: String }],
    negativeAspects: [{ type: String }],
    deliveryQuality: { type: String, enum: ['excellent', 'good', 'average', 'poor'], required: true },
    timeliness: { type: String, enum: ['on_time', 'slightly_late', 'very_late'], required: true },
    professionalism: { type: String, enum: ['excellent', 'good', 'average', 'poor'], required: true },
    ratingImpact: {
      deductionPercentage: { type: Number, default: 0 },
      bonusPercentage: { type: Number, default: 0 },
      tripEarnings: { type: Number, default: 0 },
      adjustedEarnings: { type: Number, default: 0 },
    },
    customerName: { type: String },
    customerPhone: { type: String },
    customerSignature: { type: String },
  },
  { timestamps: true }
);

driverRatingSchema.index({ driverId: 1 });
driverRatingSchema.index({ ratedByUserId: 1 });
driverRatingSchema.index({ createdAt: -1 });

export default model<IDriverRating>('DriverRating', driverRatingSchema);
