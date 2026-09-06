import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CreateTripPayload, Trip, TripStatus } from '@/types/trip';

export const TripService = {
  async list(params: {
    driverId?: string;
    branchId?: string;
    visibleToBranchId?: string;
    status?: TripStatus;
    deleted?: boolean;
  }) {
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

  async completeWithPhoto(tripId: string, photo: File) {
    const formData = new FormData();
    formData.append('photo', photo);
    const { data } = await api.post<ApiResponse<{ trip: Trip }>>(`/trips/${tripId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async remove(tripId: string) {
    const { data } = await api.delete<ApiResponse<{ trip: Trip }>>(`/trips/${tripId}`);
    return data;
  },

  async restore(tripId: string) {
    const { data } = await api.post<ApiResponse<{ trip: Trip }>>(`/trips/${tripId}/restore`);
    return data;
  },
};
