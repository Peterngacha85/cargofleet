import { create } from 'zustand';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationState {
  notifications: AppNotification[];
  push: (message: string, type?: AppNotification['type']) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

// Port of Frontend/src/stores/notificationStore.ts, minus the web-only crypto.randomUUID()
// (not reliably available under Hermes without an extra polyfill dependency).
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  push: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },

  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
