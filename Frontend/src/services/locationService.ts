import { api } from './api';
import { ApiResponse } from '@/types/api';

export interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
}

export interface LatestDriverLocation {
  driverId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export const LocationService = {
  async getTripHistory(tripId: string) {
    const { data } = await api.get<ApiResponse<{ history: LocationHistoryPoint[]; count: number }>>(
      `/locations/trip/${tripId}/history`
    );
    return data;
  },

  // A catch-up read for when a driver started sharing before this manager/admin's socket
  // connection was there to see the live broadcast - a missed WebSocket event (a brief
  // disconnect, or the page having just loaded) would otherwise leave "Not sharing location"
  // showing for a driver who actually is.
  async getDriverLatest(driverId: string) {
    const { data } = await api.get<ApiResponse<{ location: LatestDriverLocation | null }>>(
      `/locations/driver/${driverId}/latest`
    );
    return data;
  },
};
