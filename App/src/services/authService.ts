import { api } from './api';
import { ApiResponse } from '../types/api';
import { CurrentUserProfile, DriverRegisterPayload, LoginResponseData } from '../types/auth';

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

  async login(email: string, password: string) {
    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/login', { email, password });
    return data;
  },

  async googleLogin(idToken: string) {
    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/google/login?role=driver', {
      tokenId: idToken,
    });
    return data;
  },

  // licensePhoto is an Expo ImagePicker asset URI, not a File - React Native's fetch/FormData
  // accepts { uri, name, type } in place of a Blob, unlike the web app's real File object.
  async registerDriver(payload: DriverRegisterPayload, licensePhoto?: { uri: string; name: string; type: string }) {
    if (licensePhoto) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
      formData.append('licensePhoto', licensePhoto as unknown as Blob);
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
};
