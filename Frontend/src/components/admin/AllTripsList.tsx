import { useEffect, useState } from 'react';
import { MapPin, Radio } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { requestLocationSharing } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel } from '@/utils/formatters';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AllTripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [requestingShareFor, setRequestingShareFor] = useState<string | null>(null);
  const requestFocus = useMapFocusStore((s) => s.requestFocus);
  const { user } = useAuth();
  const { driverLocations } = useMap();
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    TripService.list({}).then((res) => setTrips(res.data?.trips ?? []));
  }, []);

  const idOf = (value?: string | { _id: string }) => (typeof value === 'string' ? value : value?._id);

  const tripDriverName = (trip: Trip) =>
    typeof trip.driverId === 'string' ? trip.driverId : `${trip.driverId.userId.firstName} ${trip.driverId.userId.lastName}`;

  const tripVehicleLabel = (trip: Trip) =>
    typeof trip.vehicleId === 'string'
      ? trip.vehicleId
      : `${trip.vehicleId.registrationNumber} (${trip.vehicleId.make} ${trip.vehicleId.model})`;

  const tripBranchName = (branch?: string | { _id: string; name: string }) =>
    !branch ? '—' : typeof branch === 'string' ? branch : branch.name;

  const handleShowOnMap = (trip: Trip) => {
    const driverId = idOf(trip.driverId);
    if (!driverId) return;
    // Live Map is a sibling tab within AdminPanel, which switches to it itself on seeing
    // a new focus request - no navigation needed since both tabs share the same route.
    requestFocus(driverId);
  };

  const handleRequestSharing = async (trip: Trip) => {
    const driverId = idOf(trip.driverId);
    if (!driverId || !user) return;
    setRequestingShareFor(trip._id);
    try {
      const response = await requestLocationSharing('admin', { adminId: user.id }, driverId, trip._id);
      push(
        response.success ? `Asked ${tripDriverName(trip)} to resume sharing their location.` : response.message,
        response.success ? 'success' : 'error'
      );
    } finally {
      setRequestingShareFor(null);
    }
  };

  if (trips.length === 0) {
    return <p className="text-sm text-gray-500">No trips created yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {trips.map((trip) => {
        const driverId = idOf(trip.driverId);
        const isSharing = !!driverId && !!driverLocations[driverId];

        return (
          <li key={trip._id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-charcoal">{trip.tripNumber}</p>
              <p className="text-sm text-gray-500">
                {trip.pickupLocation.address} → {trip.dropoffLocation.address}
              </p>
              <p className="text-xs text-gray-400">
                {tripDriverName(trip)} · {tripVehicleLabel(trip)} · {tripBranchName(trip.branchId)} →{' '}
                {tripBranchName(trip.destinationBranchId)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[trip.status]}`}>
                {statusLabel(trip.status)}
              </span>
              {trip.status === 'in_transit' && isSharing && (
                <button className="btn-secondary flex items-center gap-1" onClick={() => handleShowOnMap(trip)}>
                  <MapPin className="h-4 w-4" />
                  Show on Map
                </button>
              )}
              {trip.status === 'in_transit' && !isSharing && (
                <>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Radio className="h-3.5 w-3.5" />
                    Not sharing location
                  </span>
                  <button
                    className="btn-secondary flex items-center gap-1"
                    onClick={() => handleRequestSharing(trip)}
                    disabled={requestingShareFor === trip._id}
                  >
                    {requestingShareFor === trip._id ? 'Requesting…' : 'Request Sharing'}
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
