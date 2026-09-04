import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/utils/storage';
import { ApiResponse } from '@/types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      storage.clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push(() => resolve(api(originalRequest)));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refreshToken }
      );
      const newAccessToken = data.data?.accessToken;
      if (!newAccessToken) throw new Error('No access token returned');

      storage.setAccessToken(newAccessToken);
      pendingRequests.forEach((cb) => cb());
      pendingRequests = [];

      return api(originalRequest);
    } catch (refreshError) {
      storage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
