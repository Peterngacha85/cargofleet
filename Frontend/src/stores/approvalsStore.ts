import { create } from 'zustand';

interface ApprovalsState {
  pendingDriverCount: number;
  pendingManagerCount: number;
  pendingVehicleCount: number;
  scheduledTripCount: number;
  setPendingDriverCount: (n: number) => void;
  setPendingManagerCount: (n: number) => void;
  setPendingVehicleCount: (n: number) => void;
  setScheduledTripCount: (n: number) => void;
  incrementPendingDriverCount: () => void;
  incrementPendingManagerCount: () => void;
  incrementPendingVehicleCount: () => void;
  incrementScheduledTripCount: () => void;
}

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  pendingDriverCount: 0,
  pendingManagerCount: 0,
  pendingVehicleCount: 0,
  scheduledTripCount: 0,

  setPendingDriverCount: (n) => set({ pendingDriverCount: n }),
  setPendingManagerCount: (n) => set({ pendingManagerCount: n }),
  setPendingVehicleCount: (n) => set({ pendingVehicleCount: n }),
  setScheduledTripCount: (n) => set({ scheduledTripCount: n }),
  incrementPendingDriverCount: () => set((s) => ({ pendingDriverCount: s.pendingDriverCount + 1 })),
  incrementPendingManagerCount: () => set((s) => ({ pendingManagerCount: s.pendingManagerCount + 1 })),
  incrementPendingVehicleCount: () => set((s) => ({ pendingVehicleCount: s.pendingVehicleCount + 1 })),
  incrementScheduledTripCount: () => set((s) => ({ scheduledTripCount: s.scheduledTripCount + 1 })),
}));
