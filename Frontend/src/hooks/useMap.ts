import { useMapStore } from '@/stores/mapStore';

export const useMap = () => {
  const driverLocations = useMapStore((s) => s.driverLocations);
  const upsertDriverLocation = useMapStore((s) => s.upsertDriverLocation);

  return { driverLocations, upsertDriverLocation };
};
