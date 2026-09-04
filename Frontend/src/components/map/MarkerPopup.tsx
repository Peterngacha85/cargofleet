import { statusLabel } from '@/utils/formatters';

interface MarkerPopupProps {
  driverName: string;
  speed?: number;
  lastUpdated?: string;
  tripNumber?: string;
  dropoffAddress?: string;
  tripStatus?: string;
}

export default function MarkerPopup({
  driverName,
  speed,
  lastUpdated,
  tripNumber,
  dropoffAddress,
  tripStatus,
}: MarkerPopupProps) {
  return (
    <div className="text-sm">
      <p className="font-semibold text-charcoal">{driverName}</p>
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
