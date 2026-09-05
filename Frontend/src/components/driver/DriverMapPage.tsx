import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import DriverLocationMap from './DriverLocationMap';

export default function DriverMapPage() {
  const { activeTripId, activeTripNumber } = useTripTrackingStore();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        {activeTripId
          ? `Sharing your location for trip ${activeTripNumber}.`
          : 'Not currently sharing - start a trip from My Trips to begin.'}
      </p>
      <DriverLocationMap className="h-[calc(100vh-200px)] w-full" />
    </div>
  );
}
