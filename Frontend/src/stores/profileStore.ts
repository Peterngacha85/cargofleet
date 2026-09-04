import { create } from 'zustand';
import { AuthService } from '@/services/authService';
import { CurrentUserProfile } from '@/types/auth';

interface ProfileState {
  profile: CurrentUserProfile | null;
  loaded: boolean;
  fetchProfile: () => Promise<void>;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loaded: false,

  fetchProfile: async () => {
    const response = await AuthService.getMe();
    set({ profile: response.data, loaded: true });
  },

  clear: () => set({ profile: null, loaded: false }),
}));
