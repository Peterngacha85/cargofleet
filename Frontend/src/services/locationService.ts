import { api } from './api';
import { ApiResponse } from '@/types/api';

export const LocationService = {
  async getDriverLatestLocation(driverId: string) {
    const { data } = await api.get<ApiResponse<{ location: unknown }>>(`/locations/driver/${driverId}/latest`);
    return data;
  },

  async getTripLocationHistory(tripId: string) {
    const { data } = await api.get<ApiResponse<{ history: unknown[] }>>(`/locations/trip/${tripId}/history`);
    return data;
  },
};
