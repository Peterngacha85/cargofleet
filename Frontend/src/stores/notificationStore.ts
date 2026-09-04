import { create } from 'zustand';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
}

interface NotificationState {
  notifications: AppNotification[];
  push: (message: string, type?: AppNotification['type']) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  push: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, createdAt: Date.now() }],
    }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },

  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
