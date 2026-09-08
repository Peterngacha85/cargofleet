import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Fuel } from 'lucide-react';
import { TripService } from '@/services/tripService';
import { FuelLogService } from '@/services/fuelLogService';
import { connectSocket } from '@/services/socketService';
import { Trip } from '@/types/trip';
import { useProfileStore } from '@/stores/profileStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatCurrency, formatDate, statusLabel } from '@/utils/formatters';
import FieldLabel from '@/components/shared/FieldLabel';
import Select from '@/components/shared/Select';
import { FuelPaymentMethod } from '@/types/fuelLog';
import CargoItemsPanel from './CargoItemsPanel';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const fuelPaymentOptions = [
  { value: '', label: 'Not specified' },
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
];

// The transaction code is always the first token of an M-Pesa confirmation SMS
// ("UI5AM5HMR6 Confirmed. Ksh100.00 sent to...") - pasting the whole message in should still
// leave just the code, not the entire text.
const extractMpesaCode = (value: string) => value.trim().split(/\s+/)[0]?.toUpperCase() ?? '';

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

  const [loggingFuelTripId, setLoggingFuelTripId] = useState<string | null>(null);
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelPaymentMethod, setFuelPaymentMethod] = useState<FuelPaymentMethod | ''>('');
  const [fuelMpesaCode, setFuelMpesaCode] = useState('');
  const [fuelReceipt, setFuelReceipt] = useState<File | null>(null);
  const [fuelSubmitting, setFuelSubmitting] = useState(false);

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

  // A manager may reassign a trip away from this driver (or a new one their way) while this
  // page happens to be open - refetch so the list doesn't sit stale until a manual reload.
  useEffect(() => {
    if (!driverId) return;
    const socket = connectSocket('driver', { driverId });
    socket.on('tripAssigned', load);
    socket.on('tripUnassigned', load);
    return () => {
      socket.off('tripAssigned', load);
      socket.off('tripUnassigned', load);
    };
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
    navigate('/dashboard/map');
  };

  const openLogFuel = (trip: Trip) => {
    setLoggingFuelTripId(trip._id);
    setFuelLiters('');
    setFuelCost('');
    setFuelOdometer('');
    setFuelPaymentMethod('');
    setFuelMpesaCode('');
    setFuelReceipt(null);
  };

  const handleLogFuel = async (trip: Trip) => {
    const vehicleId = typeof trip.vehicleId === 'string' ? trip.vehicleId : trip.vehicleId._id;
    if (!driverId || !vehicleId) return;
    if (!fuelLiters || !fuelCost) {
      push('Enter both liters and cost.', 'warning');
      return;
    }

    setFuelSubmitting(true);
    try {
      const response = await FuelLogService.log({
        vehicleId,
        driverId,
        tripId: trip._id,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        odometerReading: fuelOdometer ? Number(fuelOdometer) : undefined,
        paymentMethod: fuelPaymentMethod || undefined,
        mpesaCode: fuelMpesaCode || undefined,
        receipt: fuelReceipt ?? undefined,
      });
      push(response.success ? 'Fuel logged.' : response.message, response.success ? 'success' : 'error');
      if (response.success) setLoggingFuelTripId(null);
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to log fuel', 'error');
    } finally {
      setFuelSubmitting(false);
    }
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
              <div className="flex flex-wrap items-center gap-2">
                {activeTripId === trip._id ? (
                  <>
                    <button
                      className="btn-secondary flex items-center gap-1"
                      onClick={handleShowOnMap}
                    >
                      <MapPin className="h-4 w-4" />
                      Show on Map
                    </button>
                    <button className="btn-secondary" onClick={handleStopSharing}>
                      Stop Sharing
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => handleResumeSharing(trip)}>
                    Resume Sharing
                  </button>
                )}
                <button
                  className="btn-secondary flex items-center gap-1"
                  onClick={() => (loggingFuelTripId === trip._id ? setLoggingFuelTripId(null) : openLogFuel(trip))}
                >
                  <Fuel className="h-4 w-4" />
                  Log Fuel
                </button>
              </div>
            )}
          </div>

          {loggingFuelTripId === trip._id && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg bg-soft-gray p-3">
              <div className="w-24">
                <FieldLabel required>Liters</FieldLabel>
                <input
                  type="number"
                  className="input-field"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                />
              </div>
              <div className="w-28">
                <FieldLabel required>Cost (KSh)</FieldLabel>
                <input
                  type="number"
                  className="input-field"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                />
              </div>
              <div className="w-32">
                <FieldLabel>Odometer</FieldLabel>
                <input
                  type="number"
                  className="input-field"
                  value={fuelOdometer}
                  onChange={(e) => setFuelOdometer(e.target.value)}
                />
              </div>
              <div className="w-32">
                <FieldLabel>Paid With</FieldLabel>
                <Select
                  value={fuelPaymentMethod}
                  onChange={(v) => setFuelPaymentMethod(v as FuelPaymentMethod | '')}
                  options={fuelPaymentOptions}
                />
              </div>
              {fuelPaymentMethod === 'mpesa' && (
                <div className="w-36">
                  <FieldLabel>M-Pesa Code</FieldLabel>
                  <input
                    className="input-field"
                    placeholder="Paste the code or the whole SMS"
                    value={fuelMpesaCode}
                    onChange={(e) => setFuelMpesaCode(extractMpesaCode(e.target.value))}
                  />
                </div>
              )}
              <div className="min-w-[160px] flex-1">
                <FieldLabel>Receipt (if given)</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="input-field"
                  onChange={(e) => setFuelReceipt(e.target.files?.[0] ?? null)}
                />
              </div>
              <button className="btn-primary" onClick={() => handleLogFuel(trip)} disabled={fuelSubmitting}>
                {fuelSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button className="btn-secondary" onClick={() => setLoggingFuelTripId(null)}>
                Cancel
              </button>
            </div>
          )}

          {trip.status === 'in_transit' && driverId && (
            <CargoItemsPanel trip={trip} driverId={driverId} onUpdated={load} />
          )}
        </li>
      ))}
    </ul>
  );
}
