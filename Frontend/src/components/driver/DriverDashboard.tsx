import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { useProfileStore } from '@/stores/profileStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import MapComponent from '@/components/map/MapComponent';
import ActiveTrips, { TripSummary } from './ActiveTrips';
import PerformanceCard from './PerformanceCard';
import { DriverLocationUpdate } from '@/types/map';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const profile = useProfileStore((s) => s.profile);
  const push = useNotificationStore((s) => s.push);
  const { activeTripId, activeTripNumber, position, stopTrip } = useTripTrackingStore();
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  useEffect(() => {
    const driverId = profile?.driver?._id;
    if (!driverId) return;
    api
      .get('/trips', { params: { driverId } })
      .then(({ data }) => setTrips(data.data?.trips ?? []))
      .catch(() => setTrips([]));
  }, [profile]);

  const handleStopSharing = () => {
    stopTrip();
    push('Location sharing stopped. The trip stays in transit until it is completed.', 'info');
  };

  const marker: DriverLocationUpdate[] = position
    ? [
        {
          driverId: profile?.driver?._id ?? 'me',
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed ?? undefined,
          timestamp: new Date().toISOString(),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PerformanceCard
        avgRating={profile?.driver?.avgRating ?? 0}
        totalTrips={profile?.driver?.totalTrips ?? 0}
        completedTrips={profile?.driver?.completedTrips ?? 0}
        totalEarnings={profile?.driver?.totalEarnings ?? 0}
      />

      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-charcoal">Live Location Sharing</p>
          <p className="text-sm text-gray-500">
            {activeTripId
              ? `Sharing your location for trip ${activeTripNumber}.`
              : 'Not currently sharing - start a trip from My Trips to begin.'}
          </p>
        </div>
        {activeTripId ? (
          <button className="btn-secondary" onClick={handleStopSharing}>
            Stop Sharing
          </button>
        ) : (
          <Link to="/dashboard/trips" className="btn-primary">
            My Trips
          </Link>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Your Trips</h2>
        <ActiveTrips trips={trips} />
      </div>

      <div className="h-80 w-full">
        <MapComponent markers={marker} labelFor={() => user?.firstName ?? 'You'} focusRequest={focusRequest} />
      </div>
    </div>
  );
}
