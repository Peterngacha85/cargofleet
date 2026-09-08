import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/env';
import { storage } from '../utils/storage';
import { ApiResponse } from '../types/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// There's no window.location redirect on native - authStore registers itself here so a
// refresh-token failure (expired/revoked session) can drop the app back to the login screen
// the same way the web app's interceptor does.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Direct port of Frontend/src/services/api.ts's refresh-retry logic - a request that gets a
// 401 waits for a single in-flight token refresh (rather than each firing its own) and retries
// once with the new access token.
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      await storage.clear();
      onUnauthorized?.();
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
      const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      const newAccessToken = data.data?.accessToken;
      if (!newAccessToken) throw new Error('No access token returned');

      await storage.setAccessToken(newAccessToken);
      pendingRequests.forEach((cb) => cb());
      pendingRequests = [];

      return api(originalRequest);
    } catch (refreshError) {
      await storage.clear();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
