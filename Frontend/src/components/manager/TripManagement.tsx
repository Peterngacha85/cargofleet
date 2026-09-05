import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { DriverService } from '@/services/driverService';
import { VehicleService } from '@/services/vehicleService';
import { Trip } from '@/types/trip';
import { Driver, DriverUserSummary } from '@/types/driver';
import { Vehicle } from '@/types/vehicle';
import { Branch } from '@/types/driver';
import { useProfileStore } from '@/stores/profileStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel } from '@/utils/formatters';
import { DEFAULT_MAP_CENTER } from '@/utils/constants';
import { geocodeAddress } from '@/utils/geocode';
import FieldLabel from '@/components/shared/FieldLabel';
import Select from '@/components/shared/Select';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

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
  const profile = useProfileStore((s) => s.profile);
  const push = useNotificationStore((s) => s.push);
  const requestFocus = useMapFocusStore((s) => s.requestFocus);
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

  const handleShowOnMap = (trip: Trip) => {
    const driverId = idOf(trip.driverId);
    if (!driverId) return;
    requestFocus(driverId);
    navigate('/dashboard');
  };

  const handleMarkReceived = async (tripId: string) => {
    const response = await TripService.updateStatus(tripId, 'completed');
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) loadTrips();
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
          <ul className="flex flex-col gap-2">
            {trips.map((trip) => {
              const crossBranch = isCrossBranch(trip);
              const inbound = crossBranch && isDestinationManager(trip);
              const canMarkReceived = inbound && trip.status !== 'completed' && trip.status !== 'cancelled';

              return (
                <li key={trip._id} className="card flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-charcoal">{trip.tripNumber}</p>
                      {crossBranch && (
                        <span className="rounded-full bg-soft-gray px-2 py-0.5 text-xs font-medium text-charcoal">
                          {inbound ? 'Inbound' : 'Outbound'}
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
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[trip.status]}`}>
                      {statusLabel(trip.status)}
                    </span>
                    {trip.status === 'in_transit' && (
                      <button
                        className="btn-secondary flex items-center gap-1"
                        onClick={() => handleShowOnMap(trip)}
                      >
                        <MapPin className="h-4 w-4" />
                        Show on Map
                      </button>
                    )}
                    {canMarkReceived && (
                      <button className="btn-primary" onClick={() => handleMarkReceived(trip._id)}>
                        Mark Received
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
