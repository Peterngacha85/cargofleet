import { create } from 'zustand';
import { AuthUser } from '../types/auth';
import { storage } from '../utils/storage';
import { setUnauthorizedHandler } from '../services/api';
import { disconnectAllSockets } from '../services/socketService';
import { useProfileStore } from './profileStore';
import { useTripTrackingStore } from './tripTrackingStore';

interface AuthState {
  user: AuthUser | null;
  // Starts false and flips once bootstrapSession() (called from App.tsx on launch) resolves -
  // RootNavigator shows a splash/loading state until then instead of flashing the login screen.
  bootstrapped: boolean;
  isAuthenticated: boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  setBootstrapped: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bootstrapped: false,
  isAuthenticated: false,

  setSession: async (accessToken, refreshToken, user) => {
    await storage.setSession(accessToken, refreshToken);
    set({ user, isAuthenticated: true, bootstrapped: true });
  },

  setBootstrapped: (user) => set({ user, isAuthenticated: !!user, bootstrapped: true }),

  logout: async () => {
    await storage.clear();
    disconnectAllSockets();
    useProfileStore.getState().clear();
    useTripTrackingStore.getState().stopTrip();
    set({ user: null, isAuthenticated: false });
  },
}));

// Wired once here (not per-call-site) so any 401-after-failed-refresh, from anywhere in the
// app, drops back to the login screen the same way the web app's redirect does.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});
