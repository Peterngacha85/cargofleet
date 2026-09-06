import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Radio, Route, Camera, AlertTriangle, UserCog } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { DriverService } from '@/services/driverService';
import { VehicleService } from '@/services/vehicleService';
import { requestLocationSharing } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { Driver, DriverUserSummary } from '@/types/driver';
import { Vehicle } from '@/types/vehicle';
import { Branch } from '@/types/driver';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useProfileStore } from '@/stores/profileStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useMapPathStore } from '@/stores/mapPathStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel, timeAgo } from '@/utils/formatters';
import { DEFAULT_MAP_CENTER } from '@/utils/constants';
import { geocodeAddress } from '@/utils/geocode';
import FieldLabel from '@/components/shared/FieldLabel';
import Select from '@/components/shared/Select';
import SearchInput from '@/components/shared/SearchInput';
import EmptyState from '@/components/shared/EmptyState';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// A trip still sitting as "scheduled" this long probably means the driver isn't going to
// start it - flagged so the manager notices it's time to reassign rather than wait indefinitely.
const STALE_SCHEDULED_MINUTES = 60;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const emptyForm = {
  driverId: '',
  vehicleId: '',
  pickupAddress: '',
  pickupLat: String(DEFAULT_MAP_CENTER[0]),
  pickupLng: String(DEFAULT_MAP_CENTER[1]),
  pickupContactName: '',
  pickupContactPhone: '',
  dropoffAddress: '',
  dropoffLat: String(DEFAULT_MAP_CENTER[0]),
  dropoffLng: String(DEFAULT_MAP_CENTER[1]),
  dropoffContactName: '',
  dropoffContactPhone: '',
  estimatedEndTime: '',
  fare: '',
};

export default function TripManagement() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState<{ pickup: boolean; dropoff: boolean }>({
    pickup: false,
    dropoff: false,
  });
  const [requestingShareFor, setRequestingShareFor] = useState<string | null>(null);
  const [completingTripId, setCompletingTripId] = useState<string | null>(null);
  const [reassigningTripId, setReassigningTripId] = useState<string | null>(null);
  const [reassignDriverId, setReassignDriverId] = useState('');
  const [reassignVehicleId, setReassignVehicleId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const profile = useProfileStore((s) => s.profile);
  const push = useNotificationStore((s) => s.push);
  const requestFocus = useMapFocusStore((s) => s.requestFocus);
  const requestPath = useMapPathStore((s) => s.requestPath);
  const { user } = useAuth();
  const { driverLocations } = useMap();
  const navigate = useNavigate();
  const branchId = profile?.manager?.assignedBranchId;

  const loadTrips = () => {
    if (!branchId) return;
    TripService.list({ visibleToBranchId: branchId }).then((res) => setTrips(res.data?.trips ?? []));
  };

  useEffect(() => {
    if (!branchId) return;
    loadTrips();
    DriverService.list({ branchId, status: 'active' }).then((res) => setDrivers(res.data?.drivers ?? []));
    VehicleService.list({ branchId, status: 'active' }).then((res) => setVehicles(res.data?.vehicles ?? []));
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const driverName = (id: string) => {
    const driver = drivers.find((d) => d._id === id);
    const u = driver?.userId as DriverUserSummary | undefined;
    return u ? `${u.firstName} ${u.lastName}` : id;
  };

  const vehicleLabel = (id: string) => {
    const vehicle = vehicles.find((v) => v._id === id);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : id;
  };

  // Trip list entries carry populated driver/vehicle/branch summaries (unlike the branch-scoped
  // `drivers`/`vehicles` arrays above, which won't contain an inbound trip's driver/vehicle).
  const idOf = (value?: string | { _id: string }) => (typeof value === 'string' ? value : value?._id);

  const tripDriverName = (trip: Trip) =>
    typeof trip.driverId === 'string' ? trip.driverId : `${trip.driverId.userId.firstName} ${trip.driverId.userId.lastName}`;

  const tripVehicleLabel = (trip: Trip) =>
    typeof trip.vehicleId === 'string'
      ? trip.vehicleId
      : `${trip.vehicleId.registrationNumber} (${trip.vehicleId.make} ${trip.vehicleId.model})`;

  const tripBranchName = (branch?: string | { _id: string; name: string }) =>
    !branch ? '—' : typeof branch === 'string' ? branch : branch.name;

  const myBranchName = branches.find((b) => b._id === branchId)?.name ?? 'your branch';

  const isDestinationManager = (trip: Trip) => idOf(trip.destinationBranchId) === branchId;
  const isCrossBranch = (trip: Trip) => idOf(trip.branchId) !== idOf(trip.destinationBranchId);

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : null;

    return trips.filter((trip) => {
      const matchesQuery =
        !query ||
        trip.tripNumber.toLowerCase().includes(query) ||
        tripDriverName(trip).toLowerCase().includes(query) ||
        trip.pickupLocation.address.toLowerCase().includes(query) ||
        trip.dropoffLocation.address.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || trip.status === statusFilter;
      const createdAt = new Date(trip.createdAt);
      const matchesDate = (!from || createdAt >= from) && (!to || createdAt <= to);

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [trips, search, statusFilter, dateFrom, dateTo]);

  const handleShowOnMap = (trip: Trip) => {
    const driverId = idOf(trip.driverId);
    if (!driverId) return;
    requestFocus(driverId);
    navigate('/dashboard/map');
  };

  // Available for any trip that's actually run, not just a live one - the recorded route
  // lives in location history independently of whether the driver is currently sharing.
  const handleShowPath = (trip: Trip) => {
    requestPath(trip._id);
    navigate('/dashboard/map');
  };

  const handleRequestSharing = async (trip: Trip) => {
    const driverId = idOf(trip.driverId);
    if (!driverId || !user) return;
    setRequestingShareFor(trip._id);
    try {
      const response = await requestLocationSharing('manager', { managerId: user.id }, driverId, trip._id);
      push(
        response.success ? `Asked ${tripDriverName(trip)} to resume sharing their location.` : response.message,
        response.success ? 'success' : 'error'
      );
    } finally {
      setRequestingShareFor(null);
    }
  };

  // Opens the device's camera (or file picker on desktop) - the actual upload happens once
  // a photo comes back, in handlePhotoSelected.
  const handleMarkReceived = (tripId: string) => {
    setCompletingTripId(tripId);
    photoInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tripId = completingTripId;
    e.target.value = '';
    if (!file || !tripId) return;

    try {
      const response = await TripService.completeWithPhoto(tripId, file);
      push(response.success ? 'Trip marked as received.' : response.message, response.success ? 'success' : 'error');
      if (response.success) loadTrips();
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to mark trip as received', 'error');
    } finally {
      setCompletingTripId(null);
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
        loadTrips();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to reassign trip', 'error');
    } finally {
      setReassignSubmitting(false);
    }
  };

  const handleFindCoordinates = async (kind: 'pickup' | 'dropoff') => {
    const address = kind === 'pickup' ? form.pickupAddress : form.dropoffAddress;
    if (!address) {
      push('Type an address first, then find its coordinates.', 'warning');
      return;
    }

    setGeocoding((g) => ({ ...g, [kind]: true }));
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        push(`Couldn't find coordinates for "${address}" - try a more specific address, or enter them manually.`, 'warning');
        return;
      }
      setForm((f) => ({
        ...f,
        [kind === 'pickup' ? 'pickupLat' : 'dropoffLat']: String(result.latitude),
        [kind === 'pickup' ? 'pickupLng' : 'dropoffLng']: String(result.longitude),
      }));
      push(`Found: ${result.displayName}`, 'success');
    } catch {
      push('Coordinate lookup failed - enter them manually instead.', 'error');
    } finally {
      setGeocoding((g) => ({ ...g, [kind]: false }));
    }
  };

  const handleCreate = async () => {
    if (!branchId) return;
    const {
      driverId,
      vehicleId,
      pickupAddress,
      pickupLat,
      pickupLng,
      pickupContactName,
      pickupContactPhone,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      dropoffContactName,
      dropoffContactPhone,
      estimatedEndTime,
      fare,
    } = form;

    if (
      !driverId ||
      !vehicleId ||
      !pickupAddress ||
      !pickupContactName ||
      !pickupContactPhone ||
      !dropoffAddress ||
      !dropoffContactName ||
      !dropoffContactPhone ||
      !estimatedEndTime ||
      !fare
    ) {
      push('Fill in all trip fields before submitting.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await TripService.create({
        driverId,
        vehicleId,
        branchId,
        pickupLocation: {
          address: pickupAddress,
          latitude: Number(pickupLat),
          longitude: Number(pickupLng),
          contactName: pickupContactName,
          contactPhone: pickupContactPhone,
        },
        dropoffLocation: {
          address: dropoffAddress,
          latitude: Number(dropoffLat),
          longitude: Number(dropoffLng),
          contactName: dropoffContactName,
          contactPhone: dropoffContactPhone,
        },
        estimatedEndTime: new Date(estimatedEndTime).toISOString(),
        fare: Number(fare),
      });
      push(response.success ? 'Trip created' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        setForm(emptyForm);
        loadTrips();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to create trip', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      <div className="card">
        <h2 className="mb-4 font-semibold text-charcoal">Create Trip</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Driver</FieldLabel>
            <Select
              value={form.driverId}
              onChange={(v) => setForm((f) => ({ ...f, driverId: v }))}
              placeholder="Select driver"
              options={drivers.map((d) => ({ value: d._id, label: driverName(d._id) }))}
            />
            {drivers.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No active drivers assigned to {myBranchName} yet - approve one into this branch first.
              </p>
            )}
          </div>
          <div>
            <FieldLabel required>Vehicle</FieldLabel>
            <Select
              value={form.vehicleId}
              onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}
              placeholder="Select vehicle"
              options={vehicles.map((v) => ({ value: v._id, label: vehicleLabel(v._id) }))}
            />
            {vehicles.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No verified vehicles assigned to {myBranchName} yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card">
            <p className="mb-3 text-sm font-semibold text-charcoal">Pickup</p>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel required>Address</FieldLabel>
                <div className="flex gap-2">
                  <input
                    className="input-field"
                    placeholder="e.g. Nairobi CBD, or a full street address"
                    value={form.pickupAddress}
                    onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-1 whitespace-nowrap"
                    onClick={() => handleFindCoordinates('pickup')}
                    disabled={geocoding.pickup}
                  >
                    <MapPin className="h-4 w-4" />
                    {geocoding.pickup ? '…' : 'Find'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Latitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={form.pickupLat}
                    onChange={(e) => setForm((f) => ({ ...f, pickupLat: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>Longitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={form.pickupLng}
                    onChange={(e) => setForm((f) => ({ ...f, pickupLng: e.target.value }))}
                  />
                </div>
              </div>
              <p className="-mt-1 text-xs text-gray-400">
                Type the address above and click Find to fill these in automatically, or enter them by hand.
              </p>
              <div>
                <FieldLabel required>Contact Name</FieldLabel>
                <input
                  className="input-field"
                  value={form.pickupContactName}
                  onChange={(e) => setForm((f) => ({ ...f, pickupContactName: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel required>Contact Phone</FieldLabel>
                <input
                  className="input-field"
                  placeholder="+254712345678"
                  value={form.pickupContactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, pickupContactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <p className="mb-3 text-sm font-semibold text-charcoal">Dropoff</p>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel required>Address</FieldLabel>
                <div className="flex gap-2">
                  <input
                    className="input-field"
                    placeholder="e.g. Westlands, or a full street address"
                    value={form.dropoffAddress}
                    onChange={(e) => setForm((f) => ({ ...f, dropoffAddress: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-1 whitespace-nowrap"
                    onClick={() => handleFindCoordinates('dropoff')}
                    disabled={geocoding.dropoff}
                  >
                    <MapPin className="h-4 w-4" />
                    {geocoding.dropoff ? '…' : 'Find'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Latitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={form.dropoffLat}
                    onChange={(e) => setForm((f) => ({ ...f, dropoffLat: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel required>Longitude</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={form.dropoffLng}
                    onChange={(e) => setForm((f) => ({ ...f, dropoffLng: e.target.value }))}
                  />
                </div>
              </div>
              <p className="-mt-1 text-xs text-gray-400">
                Type the address above and click Find to fill these in automatically, or enter them by hand.
              </p>
              <div>
                <FieldLabel required>Contact Name</FieldLabel>
                <input
                  className="input-field"
                  value={form.dropoffContactName}
                  onChange={(e) => setForm((f) => ({ ...f, dropoffContactName: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel required>Contact Phone</FieldLabel>
                <input
                  className="input-field"
                  placeholder="+254712345678"
                  value={form.dropoffContactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, dropoffContactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Estimated End Time</FieldLabel>
            <input
              type="datetime-local"
              className="input-field"
              value={form.estimatedEndTime}
              onChange={(e) => setForm((f) => ({ ...f, estimatedEndTime: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel required>Fare (KSh)</FieldLabel>
            <input
              type="number"
              className="input-field"
              value={form.fare}
              onChange={(e) => setForm((f) => ({ ...f, fare: e.target.value }))}
            />
          </div>
        </div>

        <button className="btn-primary mt-4" onClick={handleCreate} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Trip'}
        </button>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Trips</h2>
        {trips.length === 0 ? (
          <p className="text-sm text-gray-500">No trips created yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 flex flex-wrap gap-3 bg-soft-gray pb-3">
              <SearchInput
                className="min-w-[200px] flex-1"
                value={search}
                onChange={setSearch}
                placeholder="Search by trip number, driver, or address…"
              />
              <Select className="w-40" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
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
                  const crossBranch = isCrossBranch(trip);
                  const inbound = crossBranch && isDestinationManager(trip);
                  // Being the destination-branch manager is what the backend actually checks
                  // (tripController's assertCanMarkReceived) - it doesn't require the trip to be
                  // cross-branch. Gating on `inbound` here as well meant this button could never
                  // appear at all in a single-branch setup, since origin === destination branch
                  // there. `inbound` still gates the Inbound/Outbound badge below, which IS a
                  // purely cross-branch distinction.
                  const canMarkReceived = isDestinationManager(trip) && trip.status === 'in_transit';
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
                      {crossBranch && (
                        <span className="rounded-full bg-soft-gray px-2 py-0.5 text-xs font-medium text-charcoal">
                          {inbound ? 'Inbound' : 'Outbound'}
                        </span>
                      )}
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
                      {tripDriverName(trip)} · {tripVehicleLabel(trip)}
                      {crossBranch &&
                        ` · ${tripBranchName(trip.branchId)} → ${tripBranchName(trip.destinationBranchId)}`}
                      {trip.status === 'scheduled' && !isStale && ` · Scheduled ${timeAgo(trip.createdAt)}`}
                    </p>
                    {trip.reassignmentReason && (
                      <p className="text-xs text-gray-400">Reassigned - {trip.reassignmentReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[trip.status]}`}>
                      {statusLabel(trip.status)}
                    </span>
                    {trip.status === 'scheduled' && (
                      <button
                        className="btn-secondary flex items-center gap-1"
                        onClick={() => (isReassigning ? setReassigningTripId(null) : openReassign(trip))}
                      >
                        <UserCog className="h-4 w-4" />
                        Reassign Driver
                      </button>
                    )}
                    {trip.status === 'in_transit' && isSharing && (
                      <button
                        className="btn-secondary flex items-center gap-1"
                        onClick={() => handleShowOnMap(trip)}
                      >
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
                    {canMarkReceived && (
                      <button
                        className="btn-primary flex items-center gap-1"
                        onClick={() => handleMarkReceived(trip._id)}
                        disabled={completingTripId === trip._id}
                      >
                        <Camera className="h-4 w-4" />
                        {completingTripId === trip._id ? 'Uploading…' : 'Mark Received'}
                      </button>
                    )}
                    {trip.status === 'completed' && trip.proofOfDeliveryPhotoUrl && (
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
                    {(trip.status === 'in_transit' || trip.status === 'completed') && (
                      <button className="btn-secondary flex items-center gap-1" onClick={() => handleShowPath(trip)}>
                        <Route className="h-4 w-4" />
                        Show Path
                      </button>
                    )}
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
        )}
      </div>
    </div>
  );
}
