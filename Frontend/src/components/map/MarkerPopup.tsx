import { useEffect, useState } from 'react';
import { Route } from 'lucide-react';
import { statusLabel } from '@/utils/formatters';
import { reverseGeocode } from '@/utils/geocode';
import { haversineDistanceMeters } from '@/utils/geo';
import { useMapPathStore } from '@/stores/mapPathStore';
import { TripService } from '@/services/tripService';
import { LocationService } from '@/services/locationService';
import { Trip } from '@/types/trip';
import Avatar from '@/components/shared/Avatar';

interface MarkerPopupProps {
  driverName: string;
  latitude: number;
  longitude: number;
  speed?: number;
  lastUpdated?: string;
  tripId?: string;
}

const tripStatusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MarkerPopup({
  driverName,
  latitude,
  longitude,
  speed,
  lastUpdated,
  tripId,
}: MarkerPopupProps) {
  const pathRequest = useMapPathStore((s) => s.pathRequest);
  const requestPath = useMapPathStore((s) => s.requestPath);
  const clearPath = useMapPathStore((s) => s.clearPath);
  const isShowingThisPath = !!tripId && pathRequest?.tripId === tripId;
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // react-leaflet only mounts a Popup's children once it's actually opened, so this only
  // fires on click - not on every location tick for every driver on the map. Rounding the
  // coordinates keeps it from re-fetching on GPS jitter while the popup stays open.
  const roundedLat = latitude.toFixed(4);
  const roundedLng = longitude.toFixed(4);

  useEffect(() => {
    let cancelled = false;
    setCurrentLocation(null);
    reverseGeocode(Number(roundedLat), Number(roundedLng))
      .then((name) => {
        if (!cancelled) setCurrentLocation(name ?? 'Unknown location');
      })
      .catch(() => {
        if (!cancelled) setCurrentLocation('Location unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [roundedLat, roundedLng]);

  // Fetched fresh from the trip itself (not trusted to whatever the last location broadcast
  // happened to carry) so this can never show a stale "not on a trip" for a trip that's
  // actually in progress - and gives us the pickup/dropoff/driver-photo detail a live GPS
  // ping was never going to carry anyway.
  useEffect(() => {
    let cancelled = false;
    setTrip(null);
    setDistanceKm(null);
    if (!tripId) return;

    TripService.get(tripId).then((res) => {
      if (!cancelled && res.data?.trip) setTrip(res.data.trip);
    });

    LocationService.getTripHistory(tripId).then((res) => {
      if (cancelled) return;
      const points = res.data?.history ?? [];
      let meters = 0;
      for (let i = 1; i < points.length; i++) {
        meters += haversineDistanceMeters(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude
        );
      }
      setDistanceKm(meters / 1000);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const driverUser = trip && typeof trip.driverId !== 'string' ? trip.driverId.userId : undefined;

  return (
    <div className="w-56 text-sm">
      <div className="flex items-center gap-2">
        <Avatar role="driver" photoUrl={driverUser?.profilePhoto} name={driverName} size={32} />
        <div>
          <p className="font-semibold text-charcoal">{driverName}</p>
          <p className="text-xs text-gray-500">{currentLocation ?? 'Locating…'}</p>
        </div>
      </div>
      {typeof speed === 'number' && <p className="mt-1 text-gray-500">Speed: {Math.round(speed)} km/h</p>}

      {tripId ? (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {trip ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-charcoal">{trip.tripNumber}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tripStatusStyles[trip.status]}`}>
                  {statusLabel(trip.status)}
                </span>
              </div>
              <p className="mt-1 text-gray-500">From: {trip.pickupLocation.address}</p>
              <p className="text-gray-500">To: {trip.dropoffLocation.address}</p>
              {distanceKm !== null && (
                <p className="text-gray-500">Covered so far: {distanceKm.toFixed(1)} km</p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">Loading trip details…</p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs text-gray-400">Not currently on a trip</p>
      )}

      {lastUpdated && <p className="mt-1 text-gray-400">Updated: {new Date(lastUpdated).toLocaleTimeString()}</p>}

      {tripId && (
        <button
          className="btn-secondary mt-2 flex w-full items-center justify-center gap-1 !py-1 text-xs"
          onClick={() => (isShowingThisPath ? clearPath() : requestPath(tripId))}
        >
          <Route className="h-3.5 w-3.5" />
          {isShowingThisPath ? 'Hide Path' : 'Show Path'}
        </button>
      )}
    </div>
  );
}
