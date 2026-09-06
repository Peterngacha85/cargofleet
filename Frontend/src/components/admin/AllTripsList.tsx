import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Radio, Route, Trash2, History, ArrowLeft, RotateCcw, AlertTriangle, UserCog, Camera } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { DriverService } from '@/services/driverService';
import { VehicleService } from '@/services/vehicleService';
import { requestLocationSharing } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { Branch, Driver, DriverUserSummary } from '@/types/driver';
import { Vehicle } from '@/types/vehicle';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel, formatDate, timeAgo } from '@/utils/formatters';
import FieldLabel from '@/components/shared/FieldLabel';
import SearchInput from '@/components/shared/SearchInput';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

// A trip still sitting as "scheduled" this long probably means the driver isn't going to
// start it - flagged so an admin notices it's time to reassign rather than wait indefinitely.
const STALE_SCHEDULED_MINUTES = 60;

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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [requestingShareFor, setRequestingShareFor] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reassigningTripId, setReassigningTripId] = useState<string | null>(null);
  const [reassignDriverId, setReassignDriverId] = useState('');
  const [reassignVehicleId, setReassignVehicleId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
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

  const load = () => {
    TripService.list({ deleted: showHistory }).then((res) => setTrips(res.data?.trips ?? []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  useEffect(() => {
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    DriverService.list({ status: 'active' }).then((res) => setDrivers(res.data?.drivers ?? []));
    VehicleService.list({ status: 'active' }).then((res) => setVehicles(res.data?.vehicles ?? []));
  }, []);

  const idOf = (value?: string | { _id: string }) => (typeof value === 'string' ? value : value?._id);

  const driverName = (id: string) => {
    const driver = drivers.find((d) => d._id === id);
    const u = driver?.userId as DriverUserSummary | undefined;
    return u ? `${u.firstName} ${u.lastName}` : id;
  };

  const vehicleLabel = (id: string) => {
    const vehicle = vehicles.find((v) => v._id === id);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : id;
  };

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

  const handleDelete = async (trip: Trip) => {
    if (!window.confirm(`Delete trip ${trip.tripNumber}? It will be kept in Trip History and can be restored.`)) {
      return;
    }
    setActingOn(trip._id);
    try {
      const response = await TripService.remove(trip._id);
      push(response.success ? `Trip ${trip.tripNumber} deleted.` : response.message, response.success ? 'success' : 'error');
      if (response.success) load();
    } finally {
      setActingOn(null);
    }
  };

  const openReassign = (trip: Trip) => {
    setReassigningTripId(trip._id);
    setReassignDriverId('');
    setReassignVehicleId('');
    setReassignReason('');
  };

  const handleReassign = async (trip: Trip) => {
    if (!reassignDriverId || !reassignVehicleId) {
      push('Select a driver and vehicle to reassign to.', 'warning');
      return;
    }

    setReassignSubmitting(true);
    try {
      const response = await TripService.reassign(trip._id, {
        driverId: reassignDriverId,
        vehicleId: reassignVehicleId,
        reason: reassignReason.trim() || undefined,
      });
      push(response.success ? 'Trip reassigned.' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        setReassigningTripId(null);
        load();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to reassign trip', 'error');
    } finally {
      setReassignSubmitting(false);
    }
  };

  const handleRestore = async (trip: Trip) => {
    setActingOn(trip._id);
    try {
      const response = await TripService.restore(trip._id);
      push(response.success ? `Trip ${trip.tripNumber} restored.` : response.message, response.success ? 'success' : 'error');
      if (response.success) load();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 bg-soft-gray pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">{showHistory ? 'Trip History' : 'Trips'}</h2>
          {user?.role === 'admin' && (
            <button
              className="btn-secondary flex items-center gap-1 text-xs"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? <ArrowLeft className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
              {showHistory ? 'Back to Trips' : 'View Trip History'}
            </button>
          )}
        </div>
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
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-gray-500">
          {showHistory ? 'No deleted trips.' : 'No trips created yet.'}
        </p>
      ) : filteredTrips.length === 0 ? (
        <EmptyState icon={Route} title="No matching trips" description="Try a different search or filter." />
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredTrips.map((trip) => {
            const driverId = idOf(trip.driverId);
            const isSharing = !!driverId && !!driverLocations[driverId];
            const scheduledMinutes =
              trip.status === 'scheduled' ? Math.floor((Date.now() - new Date(trip.createdAt).getTime()) / 60000) : 0;
            const isStale = trip.status === 'scheduled' && scheduledMinutes >= STALE_SCHEDULED_MINUTES;
            const isReassigning = reassigningTripId === trip._id;

            return (
              <li key={trip._id} className="flex flex-col gap-2">
              <div className="card flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-charcoal">{trip.tripNumber}</p>
                    {isStale && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Scheduled {timeAgo(trip.createdAt)} - not started
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {trip.pickupLocation.address} → {trip.dropoffLocation.address}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tripDriverName(trip)} · {tripVehicleLabel(trip)} · {tripBranchName(trip.branchId)} →{' '}
                    {tripBranchName(trip.destinationBranchId)}
                  </p>
                  {trip.reassignmentReason && (
                    <p className="text-xs text-gray-400">Reassigned - {trip.reassignmentReason}</p>
                  )}
                  {showHistory && trip.deletedAt && (
                    <p className="text-xs text-gray-400">
                      Deleted {formatDate(trip.deletedAt)}{trip.deletedByName ? ` by ${trip.deletedByName}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[trip.status]}`}>
                    {statusLabel(trip.status)}
                  </span>
                  {!showHistory && trip.status === 'scheduled' && (
                    <button
                      className="btn-secondary flex items-center gap-1"
                      onClick={() => (isReassigning ? setReassigningTripId(null) : openReassign(trip))}
                    >
                      <UserCog className="h-4 w-4" />
                      Reassign Driver
                    </button>
                  )}
                  {!showHistory && trip.status === 'in_transit' && isSharing && (
                    <button className="btn-secondary flex items-center gap-1" onClick={() => handleShowOnMap(trip)}>
                      <MapPin className="h-4 w-4" />
                      Show on Map
                    </button>
                  )}
                  {!showHistory && trip.status === 'in_transit' && !isSharing && (
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
                  {!showHistory && trip.status === 'completed' && trip.proofOfDeliveryPhotoUrl && (
                    <a
                      href={trip.proofOfDeliveryPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-1"
                    >
                      <Camera className="h-4 w-4" />
                      View Photo
                    </a>
                  )}
                  {user?.role === 'admin' &&
                    (showHistory ? (
                      <button
                        className="btn-secondary flex items-center gap-1"
                        onClick={() => handleRestore(trip)}
                        disabled={actingOn === trip._id}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {actingOn === trip._id ? 'Restoring…' : 'Restore'}
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        onClick={() => handleDelete(trip)}
                        disabled={actingOn === trip._id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {actingOn === trip._id ? 'Deleting…' : 'Delete'}
                      </button>
                    ))}
                </div>
              </div>

              {isReassigning && (
                <div className="card flex flex-wrap items-end gap-3 bg-soft-gray">
                  <div className="min-w-[160px]">
                    <FieldLabel required>New Driver</FieldLabel>
                    <Select
                      value={reassignDriverId}
                      onChange={setReassignDriverId}
                      placeholder="Select driver"
                      options={drivers.map((d) => ({ value: d._id, label: driverName(d._id) }))}
                    />
                  </div>
                  <div className="min-w-[160px]">
                    <FieldLabel required>New Vehicle</FieldLabel>
                    <Select
                      value={reassignVehicleId}
                      onChange={setReassignVehicleId}
                      placeholder="Select vehicle"
                      options={vehicles.map((v) => ({ value: v._id, label: vehicleLabel(v._id) }))}
                    />
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <FieldLabel>Reason (optional)</FieldLabel>
                    <input
                      className="input-field"
                      placeholder="e.g. Driver unreachable"
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleReassign(trip)}
                    disabled={reassignSubmitting}
                  >
                    {reassignSubmitting ? 'Reassigning…' : 'Confirm'}
                  </button>
                  <button className="btn-secondary" onClick={() => setReassigningTripId(null)}>
                    Cancel
                  </button>
                </div>
              )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
