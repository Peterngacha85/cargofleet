import { Types } from 'mongoose';
import LocationHistory from '../models/LocationHistory';
import { DriverLocationPayload } from '../types/websocket';

export const recordDriverLocation = async (driverId: string, payload: DriverLocationPayload) => {
  return LocationHistory.create({
    driverId: new Types.ObjectId(driverId),
    tripId: payload.tripId ? new Types.ObjectId(payload.tripId) : undefined,
    latitude: payload.latitude,
    longitude: payload.longitude,
    accuracy: payload.accuracy,
    speed: payload.speed,
    heading: payload.heading ?? 0,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    sourceType: 'gps',
  });
};

// Used to flush points a driver's device buffered locally while offline, so each keeps the
// timestamp it was actually captured at instead of bunching up at the reconnect time.
export const recordDriverLocationBatch = async (driverId: string, payloads: DriverLocationPayload[]) => {
  return LocationHistory.insertMany(
    payloads.map((payload) => ({
      driverId: new Types.ObjectId(driverId),
      tripId: payload.tripId ? new Types.ObjectId(payload.tripId) : undefined,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      speed: payload.speed,
      heading: payload.heading ?? 0,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      sourceType: 'gps',
    }))
  );
};

export const getLatestLocationForDriver = async (driverId: string) => {
  return LocationHistory.findOne({ driverId: new Types.ObjectId(driverId) }).sort({ timestamp: -1 });
};

export const getLocationHistoryForTrip = async (tripId: string) => {
  return LocationHistory.find({ tripId: new Types.ObjectId(tripId) }).sort({ timestamp: 1 });
};
