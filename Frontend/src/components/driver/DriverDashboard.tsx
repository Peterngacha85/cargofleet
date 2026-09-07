import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useProfileStore } from '@/stores/profileStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useNotificationStore } from '@/stores/notificationStore';
import DriverLocationMap from './DriverLocationMap';
import ActiveTrips, { TripSummary } from './ActiveTrips';
import PerformanceCard from './PerformanceCard';

export default function DriverDashboard() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const profile = useProfileStore((s) => s.profile);
  const push = useNotificationStore((s) => s.push);
  const { activeTripId, activeTripNumber, stopTrip } = useTripTrackingStore();
  const navigate = useNavigate();

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
        <Link to="/dashboard/trips" className="mb-2 inline-block font-semibold text-charcoal hover:text-lime">
          Your Trips →
        </Link>
        <ActiveTrips trips={trips} onSelectTrip={() => navigate('/dashboard/trips')} />
      </div>

      <DriverLocationMap />
    </div>
  );
}
