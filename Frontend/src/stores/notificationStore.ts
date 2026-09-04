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

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  push: (message, type = 'info') =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: crypto.randomUUID(), message, type, createdAt: Date.now() },
      ],
    })),

  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
