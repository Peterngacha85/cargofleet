import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Manager } from '@/types/manager';

export const ManagerService = {
  async list(params?: { status?: string; branchId?: string }) {
    const { data } = await api.get<ApiResponse<{ managers: Manager[]; count: number }>>('/managers', { params });
    return data;
  },

  async delete(managerId: string) {
    const { data } = await api.delete<ApiResponse<{ manager: Manager }>>(`/managers/${managerId}`);
    return data;
  },

  async restore(managerId: string) {
    const { data } = await api.post<ApiResponse<{ manager: Manager }>>(`/managers/${managerId}/restore`);
    return data;
  },
};
