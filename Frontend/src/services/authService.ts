import { api } from './api';
import { ApiResponse } from '@/types/api';
import { CurrentUserProfile, DriverRegisterPayload, LoginResponseData, ManagerRegisterPayload } from '@/types/auth';

export const AuthService = {
  async getMe() {
    const { data } = await api.get<ApiResponse<CurrentUserProfile>>('/auth/me');
    return data;
  },

  async completeProfile(payload: {
    phone: string;
    drivingLicenseNumber?: string;
    licenseExpiry?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) {
    const { data } = await api.put<ApiResponse<unknown>>('/auth/complete-profile', payload);
    return data;
  },

  async superAdminLogin(email: string, password: string, secretCode: string) {
    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/super-admin/login', {
      email,
      password,
      secretCode,
    });
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/login', { email, password });
    return data;
  },

  async googleLogin(tokenId: string, role: 'driver' | 'manager') {
    const { data } = await api.post<ApiResponse<LoginResponseData>>(`/auth/google/login?role=${role}`, {
      tokenId,
    });
    return data;
  },

  async registerDriver(payload: DriverRegisterPayload, licensePhoto?: File) {
    if (licensePhoto) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
      formData.append('licensePhoto', licensePhoto);
      const { data } = await api.post<ApiResponse<{ driverId: string; status: string }>>(
        '/auth/register/driver',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    }

    const { data } = await api.post<ApiResponse<{ driverId: string; status: string }>>(
      '/auth/register/driver',
      payload
    );
    return data;
  },

  async registerManager(payload: ManagerRegisterPayload) {
    const { data } = await api.post<ApiResponse<{ managerId: string; status: string }>>(
      '/auth/register/manager',
      payload
    );
    return data;
  },
};
