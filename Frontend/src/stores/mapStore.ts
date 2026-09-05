import { create } from 'zustand';
import { DriverLocationUpdate } from '@/types/map';

interface MapState {
  driverLocations: Record<string, DriverLocationUpdate>;
  upsertDriverLocation: (update: DriverLocationUpdate) => void;
  removeDriverLocation: (driverId: string) => void;
  clear: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  driverLocations: {},

  upsertDriverLocation: (update) =>
    set((state) => ({
      driverLocations: { ...state.driverLocations, [update.driverId]: update },
    })),

  removeDriverLocation: (driverId) =>
    set((state) => {
      const { [driverId]: _removed, ...rest } = state.driverLocations;
      return { driverLocations: rest };
    }),

  clear: () => set({ driverLocations: {} }),
}));
