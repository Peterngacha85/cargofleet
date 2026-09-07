import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Driver, Branch } from '@/types/driver';
import { DriverRatingsResponse } from '@/types/rating';

export const DriverService = {
  async list(params: { branchId?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<{ drivers: Driver[]; count: number }>>('/drivers', { params });
    return data;
  },

  async getPendingApproval() {
    const { data } = await api.get<ApiResponse<{ drivers: Driver[]; count: number }>>('/drivers/pending-approval');
    return data;
  },

  async approve(driverId: string, branchId: string, approvalReason?: string) {
    const { data } = await api.post<ApiResponse<{ driver: Driver }>>(`/drivers/${driverId}/approve`, {
      branchId,
      approvalReason,
    });
    return data;
  },

  async reject(driverId: string, rejectionReason: string) {
    const { data } = await api.post<ApiResponse<{ driver: Driver }>>(`/drivers/${driverId}/reject`, {
      rejectionReason,
    });
    return data;
  },

  async assignVehicle(driverId: string, vehicleId: string) {
    const { data } = await api.post<ApiResponse<{ driver: Driver }>>(`/drivers/${driverId}/assign-vehicle`, {
      vehicleId,
    });
    return data;
  },

  async reassignBranch(driverId: string, branchId: string) {
    const { data } = await api.post<ApiResponse<{ driver: Driver }>>(`/drivers/${driverId}/reassign-branch`, {
      branchId,
    });
    return data;
  },

  async getBranches() {
    const { data } = await api.get<ApiResponse<{ branches: Branch[]; count: number }>>('/branches');
    return data;
  },

  async getRatings(driverId: string) {
    const { data } = await api.get<ApiResponse<DriverRatingsResponse>>(`/drivers/${driverId}/ratings`);
    return data;
  },
};
