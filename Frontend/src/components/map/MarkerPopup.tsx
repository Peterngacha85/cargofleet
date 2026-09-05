import { useEffect, useState } from 'react';
import { statusLabel } from '@/utils/formatters';
import { reverseGeocode } from '@/utils/geocode';

interface MarkerPopupProps {
  driverName: string;
  latitude: number;
  longitude: number;
  speed?: number;
  lastUpdated?: string;
  tripNumber?: string;
  dropoffAddress?: string;
  tripStatus?: string;
}

export default function MarkerPopup({
  driverName,
  latitude,
  longitude,
  speed,
  lastUpdated,
  tripNumber,
  dropoffAddress,
  tripStatus,
}: MarkerPopupProps) {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

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

  return (
    <div className="text-sm">
      <p className="font-semibold text-charcoal">{driverName}</p>
      <p className="text-gray-500">{currentLocation ?? 'Locating…'}</p>
      {typeof speed === 'number' && <p className="text-gray-500">Speed: {Math.round(speed)} km/h</p>}
      {tripNumber && (
        <div className="mt-1 border-t border-gray-100 pt-1">
          <p className="font-medium text-charcoal">{tripNumber}</p>
          {dropoffAddress && <p className="text-gray-500">To: {dropoffAddress}</p>}
          {tripStatus && <p className="text-gray-500">Status: {statusLabel(tripStatus)}</p>}
        </div>
      )}
      {!tripNumber && <p className="mt-1 text-xs text-gray-400">Not currently on a trip</p>}
      {lastUpdated && <p className="mt-1 text-gray-400">Updated: {new Date(lastUpdated).toLocaleTimeString()}</p>}
    </div>
  );
}
