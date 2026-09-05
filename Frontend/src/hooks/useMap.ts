import { useMapStore } from '@/stores/mapStore';

export const useMap = () => {
  const driverLocations = useMapStore((s) => s.driverLocations);
  const upsertDriverLocation = useMapStore((s) => s.upsertDriverLocation);
  const removeDriverLocation = useMapStore((s) => s.removeDriverLocation);

  return { driverLocations, upsertDriverLocation, removeDriverLocation };
};
