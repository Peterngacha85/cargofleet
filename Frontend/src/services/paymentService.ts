import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Payment, PaymentMethod } from '@/types/payment';

export const PaymentService = {
  async list(driverId: string) {
    const { data } = await api.get<ApiResponse<{ payments: Payment[]; count: number }>>('/payments', {
      params: { driverId },
    });
    return data;
  },

  async record(driverId: string, amount: number, method: PaymentMethod, note?: string) {
    const { data } = await api.post<ApiResponse<{ payment: Payment; totalPaid: number }>>('/payments', {
      driverId,
      amount,
      method,
      note,
    });
    return data;
  },
};
