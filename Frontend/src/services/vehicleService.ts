import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CreateVehiclePayload, UpdateVehiclePayload, Vehicle } from '@/types/vehicle';

const toFormData = (payload: object) => {
  const formData = new FormData();
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as string | Blob);
    }
  });
  return formData;
};

export const VehicleService = {
  async list(params?: { branchId?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<{ vehicles: Vehicle[]; count: number }>>('/vehicles', { params });
    return data;
  },

  async create(payload: CreateVehiclePayload) {
    const { data } = await api.post<ApiResponse<{ vehicle: Vehicle }>>('/vehicles', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(vehicleId: string, payload: UpdateVehiclePayload) {
    const { data } = await api.put<ApiResponse<{ vehicle: Vehicle }>>(
      `/vehicles/${vehicleId}`,
      toFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
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
