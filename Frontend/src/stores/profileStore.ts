import { create } from 'zustand';
import { AuthService } from '@/services/authService';
import { CurrentUserProfile } from '@/types/auth';

interface ProfileState {
  profile: CurrentUserProfile | null;
  loaded: boolean;
  // Whether the "Complete your profile" nudge has been dismissed for this session.
  // Dismissing it is a courtesy, not a resolution - actions that actually need a
  // complete profile (e.g. starting location sharing) should call showCompletionPrompt()
  // to bring it back rather than silently letting the user proceed.
  completionPromptDismissed: boolean;
  fetchProfile: () => Promise<void>;
  dismissCompletionPrompt: () => void;
  showCompletionPrompt: () => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loaded: false,
  completionPromptDismissed: false,

  fetchProfile: async () => {
    const response = await AuthService.getMe();
    set({ profile: response.data, loaded: true });
  },

  dismissCompletionPrompt: () => set({ completionPromptDismissed: true }),
  showCompletionPrompt: () => set({ completionPromptDismissed: false }),

  clear: () => set({ profile: null, loaded: false, completionPromptDismissed: false }),
}));
