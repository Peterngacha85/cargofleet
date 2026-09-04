import { create } from 'zustand';
import { AuthUser } from '@/types/auth';
import { storage } from '@/utils/storage';
import { disconnectAllSockets } from '@/services/socketService';
import { useProfileStore } from '@/stores/profileStore';

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
    useProfileStore.getState().clear();
    set({ user: null, isAuthenticated: false });
  },
}));
