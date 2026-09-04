import { create } from 'zustand';

interface TrackedPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
}

interface TripTrackingState {
  activeTripId: string | null;
  activeTripNumber: string | null;
  position: TrackedPosition | null;
  startTrip: (tripId: string, tripNumber: string) => void;
  stopTrip: () => void;
  setPosition: (position: TrackedPosition) => void;
}

export const useTripTrackingStore = create<TripTrackingState>((set) => ({
  activeTripId: null,
  activeTripNumber: null,
  position: null,

  startTrip: (tripId, tripNumber) => set({ activeTripId: tripId, activeTripNumber: tripNumber }),
  stopTrip: () => set({ activeTripId: null, activeTripNumber: null }),
  setPosition: (position) => set({ position }),
}));
