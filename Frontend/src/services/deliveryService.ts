import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CreateDeliveryPayload, Delivery, ItemCondition } from '@/types/delivery';

export const DeliveryService = {
  async create(payload: CreateDeliveryPayload) {
    const { data } = await api.post<ApiResponse<{ delivery: Delivery }>>('/deliveries', payload);
    return data;
  },

  async get(deliveryId: string) {
    const { data } = await api.get<ApiResponse<{ delivery: Delivery }>>(`/deliveries/${deliveryId}`);
    return data;
  },

  async updateStatus(
    deliveryId: string,
    payload: {
      status: 'delivered' | 'failed' | 'returned';
      failureReason?: string;
      finalCondition?: ItemCondition;
      proofOfDeliveryPhoto?: string;
      signatureProvided?: boolean;
    }
  ) {
    const { data } = await api.put<ApiResponse<{ delivery: Delivery }>>(`/deliveries/${deliveryId}/status`, payload);
    return data;
  },
};
