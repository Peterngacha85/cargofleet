import { create } from 'zustand';

interface PathRequest {
  tripId: string;
  // Distinct per request so clicking the same trip's "Show Path" again (after it was
  // cleared) still re-triggers the fetch, same pattern as mapFocusStore.
  token: number;
}

interface MapPathState {
  pathRequest: PathRequest | null;
  requestPath: (tripId: string) => void;
  clearPath: () => void;
}

let requestCounter = 0;

export const useMapPathStore = create<MapPathState>((set) => ({
  pathRequest: null,
  requestPath: (tripId) => set({ pathRequest: { tripId, token: ++requestCounter } }),
  clearPath: () => set({ pathRequest: null }),
}));
