import { api } from './api';
import { ApiResponse } from '@/types/api';
import { FuelLog, FuelLogTotals, FuelPaymentMethod } from '@/types/fuelLog';

export const FuelLogService = {
  async list(params: { vehicleId?: string; tripId?: string }) {
    const { data } = await api.get<ApiResponse<{ fuelLogs: FuelLog[]; count: number; totals: FuelLogTotals }>>(
      '/fuel-logs',
      { params }
    );
    return data;
  },

  async log(payload: {
    vehicleId: string;
    driverId: string;
    tripId?: string;
    liters: number;
    cost: number;
    odometerReading?: number;
    paymentMethod?: FuelPaymentMethod;
    mpesaCode?: string;
    receipt?: File;
  }) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value as string | Blob);
    });
    const { data } = await api.post<ApiResponse<{ fuelLog: FuelLog }>>('/fuel-logs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
