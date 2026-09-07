import { api } from './api';
import { ApiResponse } from '@/types/api';
import { PublicTrackingInfo, PublicRatingInfo } from '@/types/public';

export const PublicService = {
  async getTracking(token: string) {
    const { data } = await api.get<ApiResponse<PublicTrackingInfo>>(`/public/track/${token}`);
    return data;
  },

  async getRatingInfo(token: string) {
    const { data } = await api.get<ApiResponse<PublicRatingInfo>>(`/public/rate/${token}`);
    return data;
  },

  async submitRating(
    token: string,
    payload: {
      rating: number;
      comment?: string;
      customerName?: string;
      customerPhone?: string;
      positiveAspects?: string[];
      negativeAspects?: string[];
      signed?: boolean;
    }
  ) {
    const { data } = await api.post<ApiResponse<Record<string, never>>>(`/public/rate/${token}`, payload);
    return data;
  },
};
