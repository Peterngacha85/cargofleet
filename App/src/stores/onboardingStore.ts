import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_KEY = 'cargofleet_onboarding_seen';

interface OnboardingState {
  seen: boolean;
  loaded: boolean;
  check: () => Promise<void>;
  complete: () => Promise<void>;
}

// Shown once on first launch, before the auth screens - persisted so it doesn't reappear on
// every app open (checked once during App.tsx's bootstrap, alongside the session check).
export const useOnboardingStore = create<OnboardingState>((set) => ({
  seen: false,
  loaded: false,

  check: async () => {
    const value = await AsyncStorage.getItem(SEEN_KEY);
    set({ seen: value === 'true', loaded: true });
  },

  complete: async () => {
    await AsyncStorage.setItem(SEEN_KEY, 'true');
    set({ seen: true });
  },
}));
