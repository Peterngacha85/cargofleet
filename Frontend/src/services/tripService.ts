import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CreateTripPayload, Trip, TripStatus } from '@/types/trip';

export const TripService = {
  async list(params: { driverId?: string; branchId?: string; visibleToBranchId?: string; status?: TripStatus }) {
    const { data } = await api.get<ApiResponse<{ trips: Trip[]; count: number }>>('/trips', { params });
    return data;
  },

  async create(payload: CreateTripPayload) {
    const { data } = await api.post<ApiResponse<{ trip: Trip }>>('/trips', payload);
    return data;
  },

  async updateStatus(tripId: string, status: TripStatus) {
    const { data } = await api.put<ApiResponse<{ trip: Trip }>>(`/trips/${tripId}/status`, { status });
    return data;
  },
};
