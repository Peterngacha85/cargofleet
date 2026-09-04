import { create } from 'zustand';
import { AuthUser } from '@/types/auth';
import { storage } from '@/utils/storage';
import { disconnectAllSockets } from '@/services/socketService';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storage.getUser<AuthUser>(),
  isAuthenticated: !!storage.getAccessToken(),

  setSession: (accessToken, refreshToken, user) => {
    storage.setSession(accessToken, refreshToken, user);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    storage.clear();
    disconnectAllSockets();
    set({ user: null, isAuthenticated: false });
  },
}));
