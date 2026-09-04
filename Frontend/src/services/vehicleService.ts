import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CreateVehiclePayload, Vehicle } from '@/types/vehicle';

export const VehicleService = {
  async list(params?: { branchId?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<{ vehicles: Vehicle[]; count: number }>>('/vehicles', { params });
    return data;
  },

  async create(payload: CreateVehiclePayload) {
    const { data } = await api.post<ApiResponse<{ vehicle: Vehicle }>>('/vehicles', payload);
    return data;
  },

  async getPendingVerification() {
    const { data } = await api.get<ApiResponse<{ vehicles: Vehicle[]; count: number }>>(
      '/vehicles/pending-verification'
    );
    return data;
  },

  async verify(vehicleId: string) {
    const { data } = await api.post<ApiResponse<{ vehicle: Vehicle }>>(`/vehicles/${vehicleId}/verify`);
    return data;
  },

  async reject(vehicleId: string, rejectionReason: string) {
    const { data } = await api.post<ApiResponse<{ vehicle: Vehicle }>>(`/vehicles/${vehicleId}/reject`, {
      rejectionReason,
    });
    return data;
  },
};
