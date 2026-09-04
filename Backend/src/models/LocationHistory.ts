import { Schema, model, Document, Types } from 'mongoose';
import { LOCATION_HISTORY_RETENTION_SECONDS } from '../utils/constants';

export interface ILocationHistory extends Document {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  tripId?: Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: Date;
  sourceType: 'gps' | 'network';
}

const locationHistorySchema = new Schema<ILocationHistory>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  sourceType: { type: String, enum: ['gps', 'network'], default: 'gps' },
});

locationHistorySchema.index({ driverId: 1, timestamp: -1 });
locationHistorySchema.index({ tripId: 1, timestamp: -1 });
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: LOCATION_HISTORY_RETENTION_SECONDS });

export default model<ILocationHistory>('LocationHistory', locationHistorySchema);
