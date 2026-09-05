import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Radio, Route } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { DriverService } from '@/services/driverService';
import { requestLocationSharing } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { Branch } from '@/types/driver';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel } from '@/utils/formatters';
import SearchInput from '@/components/shared/SearchInput';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AllTripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [requestingShareFor, setRequestingShareFor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const requestFocus = useMapFocusStore((s) => s.requestFocus);
  const { user } = useAuth();
  const { driverLocations } = useMap();
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();

  useEffect(() => {
    TripService.list({}).then((res) => setTrips(res.data?.trips ?? []));
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
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
    requestFocus(driverId);
    navigate('/dashboard/map');
  };

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    // Include the whole "to" day, not just its midnight.
    const to = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : null;

    return trips.filter((trip) => {
      const matchesQuery =
        !query ||
        trip.tripNumber.toLowerCase().includes(query) ||
        tripDriverName(trip).toLowerCase().includes(query) ||
        trip.pickupLocation.address.toLowerCase().includes(query) ||
        trip.dropoffLocation.address.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || trip.status === statusFilter;
      const matchesBranch =
        !branchFilter || idOf(trip.branchId) === branchFilter || idOf(trip.destinationBranchId) === branchFilter;
      const createdAt = new Date(trip.createdAt);
      const matchesDate = (!from || createdAt >= from) && (!to || createdAt <= to);

      return matchesQuery && matchesStatus && matchesBranch && matchesDate;
    });
  }, [trips, search, statusFilter, branchFilter, dateFrom, dateTo]);

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          className="min-w-[200px] flex-1"
          value={search}
          onChange={setSearch}
          placeholder="Search by trip number, driver, or address…"
        />
        <Select className="w-40" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <Select
          className="w-44"
          value={branchFilter}
          onChange={setBranchFilter}
          options={[{ value: '', label: 'All Branches' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
        />
        <input
          type="date"
          className="input-field w-40"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          className="input-field w-40"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="To date"
        />
      </div>

      {filteredTrips.length === 0 ? (
        <EmptyState icon={Route} title="No matching trips" description="Try a different search or filter." />
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredTrips.map((trip) => {
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
      )}
    </div>
  );
}
