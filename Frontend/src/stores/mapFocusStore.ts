import { create } from 'zustand';

interface FocusRequest {
  driverId: string;
  // Distinct per request (even for the same driver) so a repeat click still re-triggers
  // the fly-to, and so the map can keep retrying until that driver's marker actually exists.
  token: number;
}

interface MapFocusState {
  focusRequest: FocusRequest | null;
  requestFocus: (driverId: string) => void;
}

let requestCounter = 0;

export const useMapFocusStore = create<MapFocusState>((set) => ({
  focusRequest: null,
  requestFocus: (driverId) => set({ focusRequest: { driverId, token: ++requestCounter } }),
}));
