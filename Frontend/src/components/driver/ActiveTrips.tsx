import { statusLabel } from '@/utils/formatters';

export interface TripSummary {
  _id: string;
  tripNumber: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  pickupLocation: { address: string };
  dropoffLocation: { address: string };
  fare: number;
}

const statusColor: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface ActiveTripsProps {
  trips: TripSummary[];
  onSelectTrip?: (tripId: string) => void;
}

export default function ActiveTrips({ trips, onSelectTrip }: ActiveTripsProps) {
  if (trips.length === 0) {
    return <p className="text-sm text-gray-500">No active trips assigned right now.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {trips.map((trip) => (
        <li
          key={trip._id}
          className="card flex cursor-pointer items-center justify-between hover:border-lime"
          onClick={() => onSelectTrip?.(trip._id)}
        >
          <div>
            <p className="font-medium text-charcoal">{trip.tripNumber}</p>
            <p className="text-sm text-gray-500">
              {trip.pickupLocation.address} → {trip.dropoffLocation.address}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[trip.status]}`}>
            {statusLabel(trip.status)}
          </span>
        </li>
      ))}
    </ul>
  );
}
