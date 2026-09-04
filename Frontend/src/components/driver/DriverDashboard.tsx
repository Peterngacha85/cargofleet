import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import { useProfileStore } from '@/stores/profileStore';
import MapComponent from '@/components/map/MapComponent';
import ActiveTrips, { TripSummary } from './ActiveTrips';
import PerformanceCard from './PerformanceCard';
import { DriverLocationUpdate } from '@/types/map';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const profile = useProfileStore((s) => s.profile);
  const { position } = useLocation(sharing);
  const socketRef = useSocket('driver', { driverId: profile?.driver?._id ?? '' }, !!profile?.driver);

  useEffect(() => {
    const driverId = profile?.driver?._id;
    if (!driverId) return;
    api
      .get('/trips', { params: { driverId } })
      .then(({ data }) => setTrips(data.data?.trips ?? []))
      .catch(() => setTrips([]));
  }, [profile]);

  useEffect(() => {
    if (!position || !socketRef.current) return;
    socketRef.current.emit('sendLocation', {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed ?? 0,
      heading: position.heading ?? 0,
    });
  }, [position, socketRef]);

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
          <p className="text-sm text-gray-500">Share your location so your branch manager can track this trip.</p>
        </div>
        <button className="btn-primary" onClick={() => setSharing((v) => !v)}>
          {sharing ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>

      <div className="h-80 w-full">
        <MapComponent markers={marker} labelFor={() => user?.firstName ?? 'You'} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Your Trips</h2>
        <ActiveTrips trips={trips} />
      </div>
    </div>
  );
}
