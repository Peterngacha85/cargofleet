import { create } from 'zustand';
import { Driver } from '@/types/driver';

interface DriverState {
  pendingDrivers: Driver[];
  setPendingDrivers: (drivers: Driver[]) => void;
  removePendingDriver: (driverId: string) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  pendingDrivers: [],

  setPendingDrivers: (drivers) => set({ pendingDrivers: drivers }),

  removePendingDriver: (driverId) =>
    set((state) => ({ pendingDrivers: state.pendingDrivers.filter((d) => d._id !== driverId) })),
}));
