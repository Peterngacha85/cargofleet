import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { connectSocket } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { useProfileStore } from '@/stores/profileStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatCurrency, formatDate, statusLabel } from '@/utils/formatters';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [starting, setStarting] = useState<string | null>(null);
  const profile = useProfileStore((s) => s.profile);
  const setScheduledTripCount = useApprovalsStore((s) => s.setScheduledTripCount);
  const { activeTripId, startTrip, stopTrip } = useTripTrackingStore();
  const requestFocus = useMapFocusStore((s) => s.requestFocus);
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();
  const driverId = profile?.driver?._id;

  const load = () => {
    if (!driverId) return;
    TripService.list({ driverId }).then((res) => {
      const list = res.data?.trips ?? [];
      setTrips(list);
      setScheduledTripCount(list.filter((t) => t.status === 'scheduled').length);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const hasActiveTrip = trips.some((t) => t.status === 'in_transit');

  const handleStartTrip = (trip: Trip) => {
    if (!driverId) return;
    if (!navigator.geolocation) {
      push('This browser does not support location sharing.', 'error');
      return;
    }

    setStarting(trip._id);
    // getCurrentPosition is what actually triggers the browser's permission prompt.
    navigator.geolocation.getCurrentPosition(
      () => {
        const socket = connectSocket('driver', { driverId });
        socket.emit(
          'updateTripStatus',
          { tripId: trip._id, status: 'in_transit' },
          (response: { success: boolean; message: string }) => {
            setStarting(null);
            if (!response.success) {
              push(response.message, 'error');
              return;
            }

            startTrip(trip._id, trip.tripNumber);
            setTrips((prev) => prev.map((t) => (t._id === trip._id ? { ...t, status: 'in_transit' } : t)));
            setScheduledTripCount(trips.filter((t) => t.status === 'scheduled' && t._id !== trip._id).length);
            push(`Trip ${trip.tripNumber} started - sharing your location.`, 'success');
          }
        );
      },
      () => {
        push('Location access is required to start a trip. Please allow it and try again.', 'error');
        setStarting(null);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleStopSharing = () => {
    stopTrip();
    push('Location sharing stopped. The trip stays in transit until it is completed.', 'info');
  };

  const handleResumeSharing = (trip: Trip) => {
    startTrip(trip._id, trip.tripNumber);
    push(`Resumed sharing for trip ${trip.tripNumber}.`, 'success');
  };

  const handleShowOnMap = () => {
    if (!driverId) return;
    requestFocus(driverId);
    navigate('/dashboard');
  };

  if (trips.length === 0) {
    return <p className="text-sm text-gray-500">No trips assigned yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {trips.map((trip) => (
        <li key={trip._id} className="card flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-charcoal">{trip.tripNumber}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[trip.status]}`}>
              {statusLabel(trip.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pickup</p>
              <p className="text-sm text-charcoal">{trip.pickupLocation.address}</p>
              <p className="text-xs text-gray-500">
                {trip.pickupLocation.contactName} · {trip.pickupLocation.contactPhone}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Dropoff</p>
              <p className="text-sm text-charcoal">{trip.dropoffLocation.address}</p>
              <p className="text-xs text-gray-500">
                {trip.dropoffLocation.contactName} · {trip.dropoffLocation.contactPhone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Fare: {formatCurrency(trip.fare)}</span>
              <span>Due: {formatDate(trip.estimatedEndTime)}</span>
            </div>

            {trip.status === 'scheduled' && (
              <div className="flex flex-col items-end gap-1">
                <button
                  className="btn-primary"
                  onClick={() => handleStartTrip(trip)}
                  disabled={starting === trip._id || hasActiveTrip}
                >
                  {starting === trip._id ? 'Requesting location…' : 'Start Trip'}
                </button>
                {hasActiveTrip && (
                  <span className="text-xs text-gray-400">Complete your active trip first</span>
                )}
              </div>
            )}

            {trip.status === 'in_transit' && (
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary flex items-center gap-1"
                  onClick={handleShowOnMap}
                >
                  <MapPin className="h-4 w-4" />
                  Show on Map
                </button>
                {activeTripId === trip._id ? (
                  <button className="btn-secondary" onClick={handleStopSharing}>
                    Stop Sharing
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => handleResumeSharing(trip)}>
                    Resume Sharing
                  </button>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
