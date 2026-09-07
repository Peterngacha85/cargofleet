import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Photo } from '@/types/photo';

export const FileService = {
  async uploadDeliveryPhoto(
    file: File,
    deliveryId: string,
    tripId: string,
    driverId: string,
    photoType: 'proof_of_delivery' | 'damage_report' | 'vehicle_condition' = 'proof_of_delivery'
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deliveryId', deliveryId);
    formData.append('tripId', tripId);
    formData.append('driverId', driverId);
    formData.append('photoType', photoType);

    const { data } = await api.post<ApiResponse<{ photo: Photo }>>('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
