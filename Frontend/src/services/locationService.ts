import { api } from './api';
import { ApiResponse } from '@/types/api';

export interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
}

export const LocationService = {
  async getTripHistory(tripId: string) {
    const { data } = await api.get<ApiResponse<{ history: LocationHistoryPoint[]; count: number }>>(
      `/locations/trip/${tripId}/history`
    );
    return data;
  },
};
