import { api } from './api';
import { ApiResponse } from '@/types/api';
import { Photo, ArchiveStatus } from '@/types/photo';

export const PhotoService = {
  async list(params: { archiveStatus?: ArchiveStatus } = {}) {
    const { data } = await api.get<ApiResponse<{ photos: Photo[]; count: number }>>('/photos', { params });
    return data;
  },

  async approveDeletion(photoId: string, archiveReason?: string) {
    const { data } = await api.post<ApiResponse<{ photo: Photo }>>(`/photos/${photoId}/approve-deletion`, {
      archiveReason,
    });
    return data;
  },

  async archive(photoId: string) {
    const { data } = await api.post<ApiResponse<{ photo: Photo }>>(`/photos/${photoId}/archive`);
    return data;
  },
};
