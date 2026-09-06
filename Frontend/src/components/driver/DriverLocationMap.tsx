import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/profileStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import MapComponent from '@/components/map/MapComponent';
import { DriverLocationUpdate } from '@/types/map';

interface DriverLocationMapProps {
  // Small preview on the main dashboard card vs. full-height on the dedicated My Map page.
  className?: string;
}

export default function DriverLocationMap({ className = 'h-80 w-full' }: DriverLocationMapProps) {
  const { user } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const position = useTripTrackingStore((s) => s.position);
  const activeTripId = useTripTrackingStore((s) => s.activeTripId);
  const activeTripNumber = useTripTrackingStore((s) => s.activeTripNumber);
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  const marker: DriverLocationUpdate[] = position
    ? [
        {
          driverId: profile?.driver?._id ?? 'me',
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed ?? undefined,
          timestamp: new Date().toISOString(),
          // This marker is built locally from the browser's own GPS state, not from the
          // driverLocationUpdate socket broadcast (which only reaches managers/admins) -
          // so it has to attach the active trip itself for the popup to show it correctly.
          tripId: activeTripId ?? undefined,
          tripNumber: activeTripNumber ?? undefined,
          tripStatus: activeTripId ? 'in_transit' : undefined,
        },
      ]
    : [];

  return (
    <div className={className}>
      <MapComponent markers={marker} labelFor={() => user?.firstName ?? 'You'} focusRequest={focusRequest} />
    </div>
  );
}
