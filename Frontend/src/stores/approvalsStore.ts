import { create } from 'zustand';

interface ApprovalsState {
  pendingDriverCount: number;
  pendingManagerCount: number;
  pendingVehicleCount: number;
  pendingDriverDeletionCount: number;
  scheduledTripCount: number;
  activePhotoCount: number;
  setPendingDriverCount: (n: number) => void;
  setPendingManagerCount: (n: number) => void;
  setPendingVehicleCount: (n: number) => void;
  setPendingDriverDeletionCount: (n: number) => void;
  setScheduledTripCount: (n: number) => void;
  setActivePhotoCount: (n: number) => void;
  incrementPendingDriverCount: () => void;
  incrementPendingManagerCount: () => void;
  incrementPendingVehicleCount: () => void;
  incrementPendingDriverDeletionCount: () => void;
  incrementScheduledTripCount: () => void;
  decrementScheduledTripCount: () => void;
  incrementActivePhotoCount: () => void;
}

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  pendingDriverCount: 0,
  pendingManagerCount: 0,
  pendingVehicleCount: 0,
  pendingDriverDeletionCount: 0,
  scheduledTripCount: 0,
  activePhotoCount: 0,

  setPendingDriverCount: (n) => set({ pendingDriverCount: n }),
  setPendingManagerCount: (n) => set({ pendingManagerCount: n }),
  setPendingVehicleCount: (n) => set({ pendingVehicleCount: n }),
  setPendingDriverDeletionCount: (n) => set({ pendingDriverDeletionCount: n }),
  setScheduledTripCount: (n) => set({ scheduledTripCount: n }),
  setActivePhotoCount: (n) => set({ activePhotoCount: n }),
  incrementPendingDriverCount: () => set((s) => ({ pendingDriverCount: s.pendingDriverCount + 1 })),
  incrementPendingManagerCount: () => set((s) => ({ pendingManagerCount: s.pendingManagerCount + 1 })),
  incrementPendingVehicleCount: () => set((s) => ({ pendingVehicleCount: s.pendingVehicleCount + 1 })),
  incrementPendingDriverDeletionCount: () =>
    set((s) => ({ pendingDriverDeletionCount: s.pendingDriverDeletionCount + 1 })),
  incrementScheduledTripCount: () => set((s) => ({ scheduledTripCount: s.scheduledTripCount + 1 })),
  decrementScheduledTripCount: () => set((s) => ({ scheduledTripCount: Math.max(0, s.scheduledTripCount - 1) })),
  incrementActivePhotoCount: () => set((s) => ({ activePhotoCount: s.activePhotoCount + 1 })),
}));
