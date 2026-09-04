import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Manager } from '@/types/manager';

export const ManagerService = {
  async list(params?: { status?: string; branchId?: string }) {
    const { data } = await api.get<ApiResponse<{ managers: Manager[]; count: number }>>('/managers', { params });
    return data;
  },
};
