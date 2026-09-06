import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import CompleteProfileModal from '@/components/shared/CompleteProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useLocation } from '@/hooks/useLocation';
import { useProfileStore } from '@/stores/profileStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import { useMapStore } from '@/stores/mapStore';
import { TripService } from '@/services/tripService';
import { DriverService } from '@/services/driverService';
import { VehicleService } from '@/services/vehicleService';
import { api } from '@/services/api';
import { DriverLocationUpdate } from '@/types/map';
import {
  enqueueOfflineLocationPoint,
  getQueuedLocationPoints,
  clearQueuedLocationPoints,
  QueuedLocationPoint,
} from '@/utils/offlineLocationQueue';
import { haversineDistanceMeters } from '@/utils/geo';
import { MIN_LOCATION_MOVEMENT_METERS, MIN_LOCATION_HEARTBEAT_MS } from '@/utils/constants';
import DriverDashboard from '@/components/driver/DriverDashboard';
import MyTrips from '@/components/driver/MyTrips';
import DriverMapPage from '@/components/driver/DriverMapPage';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import ManagerMapPage from '@/components/manager/ManagerMapPage';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminMapPage from '@/components/admin/AdminMapPage';
import DriverRoster from '@/components/manager/DriverRoster';
import VehicleList from '@/components/manager/VehicleList';
import TripManagement from '@/components/manager/TripManagement';
import BranchManagement from '@/components/admin/BranchManagement';
import AllTripsList from '@/components/admin/AllTripsList';
import DriverDirectory from '@/components/shared/DriverDirectory';
import ManagerDirectory from '@/components/admin/ManagerDirectory';
import UserManagement from '@/components/admin/UserManagement';
import SystemAnalytics from '@/components/admin/SystemAnalytics';
import VehicleDirectory from '@/components/admin/VehicleDirectory';
import MyProfilePage from './MyProfilePage';

function RoleHome() {
  const { role } = useAuth();
  if (role === 'admin') return <AdminOverview />;
  if (role === 'manager') return <ManagerDashboard />;
  return <DriverDashboard />;
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { profile, loaded, fetchProfile, completionPromptDismissed, dismissCompletionPrompt } = useProfileStore();
  const incrementPendingDriverCount = useApprovalsStore((s) => s.incrementPendingDriverCount);
  const incrementPendingManagerCount = useApprovalsStore((s) => s.incrementPendingManagerCount);
  const incrementPendingVehicleCount = useApprovalsStore((s) => s.incrementPendingVehicleCount);
  const incrementScheduledTripCount = useApprovalsStore((s) => s.incrementScheduledTripCount);
  const decrementScheduledTripCount = useApprovalsStore((s) => s.decrementScheduledTripCount);
  const setPendingDriverCount = useApprovalsStore((s) => s.setPendingDriverCount);
  const setPendingManagerCount = useApprovalsStore((s) => s.setPendingManagerCount);
  const setPendingVehicleCount = useApprovalsStore((s) => s.setPendingVehicleCount);
  const setScheduledTripCount = useApprovalsStore((s) => s.setScheduledTripCount);
  const push = useNotificationStore((s) => s.push);

  const notificationNamespace = role === 'admin' ? 'admin' : role === 'driver' ? 'driver' : 'manager';
  const notificationAuth: Record<string, string> =
    role === 'admin'
      ? { adminId: user?.id ?? '' }
      : role === 'driver'
        ? { driverId: profile?.driver?._id ?? '' }
        : { managerId: user?.id ?? '' };
  const notificationsEnabled = role === 'admin' || role === 'manager' || (role === 'driver' && !!profile?.driver);
  const registrationSocketRef = useSocket(notificationNamespace, notificationAuth, notificationsEnabled);

  // Lives here (not in DriverDashboard/MyTrips) so watching + sharing survives navigating
  // between dashboard sub-pages - only starting/stopping a trip actually starts/stops it.
  const activeTripId = useTripTrackingStore((s) => s.activeTripId);
  const setTrackedPosition = useTripTrackingStore((s) => s.setPosition);
  const startTrackedTrip = useTripTrackingStore((s) => s.startTrip);
  const { position } = useLocation(role === 'driver' && !!activeTripId);
  // Selecting only the two actions (not driverLocations itself, via the useMap() wrapper)
  // keeps this component from re-rendering on every driver's GPS tick (~every 2s) no
  // matter which page is open - that churn was making inputs elsewhere feel intermittently
  // unresponsive if a click landed right as a re-render was committing.
  const upsertDriverLocation = useMapStore((s) => s.upsertDriverLocation);
  const removeDriverLocation = useMapStore((s) => s.removeDriverLocation);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate sidebar badge counts as soon as the dashboard loads, rather than only after the
  // user happens to visit the specific approvals/vehicles page that would otherwise set them.
  useEffect(() => {
    if (role === 'admin') {
      DriverService.getPendingApproval().then((res) => setPendingDriverCount(res.data?.drivers.length ?? 0));
      api
        .get('/managers/pending-verification')
        .then((res) => setPendingManagerCount(res.data.data?.managers?.length ?? 0));
      VehicleService.list({}).then((res) => {
        const list = res.data?.vehicles ?? [];
        setPendingVehicleCount(list.filter((v) => v.status === 'pending_verification').length);
      });
    } else if (role === 'manager') {
      DriverService.getPendingApproval().then((res) => setPendingDriverCount(res.data?.drivers.length ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // tripTrackingStore is in-memory only, so a refresh/navigation away and back would otherwise
  // silently drop tracking for a trip the backend still considers in_transit. Restore it from
  // the source of truth once per session - guarded by a ref (not activeTripId) so a deliberate
  // "Stop Sharing" click doesn't get immediately undone by this same effect re-firing.
  const hasAttemptedRestoreRef = useRef(false);

  useEffect(() => {
    const driverId = profile?.driver?._id;
    if (role !== 'driver' || !driverId || hasAttemptedRestoreRef.current) return;
    hasAttemptedRestoreRef.current = true;

    TripService.list({ driverId }).then((res) => {
      const trips = res.data?.trips ?? [];
      const active = trips.find((t) => t.status === 'in_transit');
      if (active) {
        startTrackedTrip(active._id, active.tripNumber);
      }
      setScheduledTripCount(trips.filter((t) => t.status === 'scheduled').length);
    });
  }, [role, profile?.driver?._id, startTrackedTrip]);

  useEffect(() => {
    if (!position) return;
    setTrackedPosition(position);
  }, [position, setTrackedPosition]);

  const lastRecordedPointRef = useRef<{ latitude: number; longitude: number; time: number } | null>(null);

  useEffect(() => {
    if (!position || !activeTripId) return;
    const socket = registrationSocketRef.current;
    if (!socket) return;

    const last = lastRecordedPointRef.current;
    if (last) {
      const movedMeters = haversineDistanceMeters(last.latitude, last.longitude, position.latitude, position.longitude);
      const elapsedMs = Date.now() - last.time;
      // Skip this GPS tick as noise unless the driver has actually moved, or it's been long
      // enough that a "still here" point is worth recording even while stopped.
      if (movedMeters < MIN_LOCATION_MOVEMENT_METERS && elapsedMs < MIN_LOCATION_HEARTBEAT_MS) {
        return;
      }
    }
    lastRecordedPointRef.current = { latitude: position.latitude, longitude: position.longitude, time: Date.now() };

    const point: QueuedLocationPoint = {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed ?? 0,
      heading: position.heading ?? 0,
      tripId: activeTripId,
      timestamp: new Date().toISOString(),
    };

    // GPS itself doesn't need a connection, but reaching the server does - buffer locally
    // instead of dropping the point so the trip's recorded route has no gap once back online.
    // Re-checked on every GPS tick (~2s) rather than a one-off "on reconnect" listener, so a
    // backlog gets flushed the moment connectivity returns without depending on the socket
    // ref already being populated by the time this effect first attaches.
    if (!socket.connected) {
      enqueueOfflineLocationPoint(point);
      return;
    }

    const queued = getQueuedLocationPoints();
    if (queued.length > 0) {
      socket.emit('sendLocationBatch', { points: [...queued, point] }, (response?: { success: boolean }) => {
        if (response?.success) clearQueuedLocationPoints();
      });
    } else {
      socket.emit('sendLocation', point);
    }
  }, [position, activeTripId, registrationSocketRef]);

  // Tells managers/admins to drop this driver's marker the instant sharing stops, rather than
  // leaving it frozen at its last position until someone happens to refresh their map.
  const prevActiveTripIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevActiveTripIdRef.current && !activeTripId) {
      registrationSocketRef.current?.emit('stopSharing');
    }
    prevActiveTripIdRef.current = activeTripId;
  }, [activeTripId, registrationSocketRef]);

  // Live badge/toast for new registrations, kept here (not in the list pages) so it fires
  // no matter which dashboard sub-page the manager/admin currently has open.
  useEffect(() => {
    const socket = registrationSocketRef.current;
    if (!socket) return;

    const handleNewDriver = (payload: { firstName: string; lastName: string }) => {
      incrementPendingDriverCount();
      push(`New driver registered: ${payload.firstName} ${payload.lastName}`, 'info');
    };
    const handleNewManager = (payload: { firstName: string; lastName: string }) => {
      incrementPendingManagerCount();
      push(`New manager registered: ${payload.firstName} ${payload.lastName}`, 'info');
    };
    const handleNewVehicle = (payload: { registrationNumber: string; make: string; model: string }) => {
      incrementPendingVehicleCount();
      push(`New vehicle added: ${payload.registrationNumber} (${payload.make} ${payload.model})`, 'info');
    };
    const handleTripAssigned = (payload: { tripNumber: string; dropoffAddress: string }) => {
      incrementScheduledTripCount();
      push(`New trip assigned: ${payload.tripNumber} to ${payload.dropoffAddress}`, 'info');
    };
    // Fires on the previous driver's own socket when a manager/admin reassigns their scheduled
    // trip to someone else - e.g. they never responded/started it.
    const handleTripUnassigned = (payload: { tripNumber: string; reason?: string }) => {
      decrementScheduledTripCount();
      push(
        `Trip ${payload.tripNumber} was reassigned to another driver${payload.reason ? `: ${payload.reason}` : '.'}`,
        'warning'
      );
    };

    // Tracked here (not in TeamMap) so "is this driver currently sharing?" stays accurate
    // for the Trips tab too, even when the Live Map tab isn't the one mounted right now.
    const handleLocationUpdate = (update: DriverLocationUpdate) => upsertDriverLocation(update);
    const handleStoppedSharing = ({ driverId }: { driverId: string }) => removeDriverLocation(driverId);

    // A manager/admin asked this driver (from the Trips tab) to resume sharing their location.
    const handleSharingRequested = (payload: { tripNumber: string; requestedByRole: string }) => {
      push(`${payload.requestedByRole === 'admin' ? 'Admin' : 'A manager'} asked you to resume sharing your location for trip ${payload.tripNumber}.`, 'warning');
    };

    socket.on('newDriverRegistration', handleNewDriver);
    socket.on('newManagerRegistration', handleNewManager);
    socket.on('newVehicleRegistration', handleNewVehicle);
    socket.on('tripAssigned', handleTripAssigned);
    socket.on('tripUnassigned', handleTripUnassigned);
    socket.on('driverLocationUpdate', handleLocationUpdate);
    socket.on('driverStoppedSharing', handleStoppedSharing);
    socket.on('locationSharingRequested', handleSharingRequested);

    return () => {
      socket.off('newDriverRegistration', handleNewDriver);
      socket.off('newManagerRegistration', handleNewManager);
      socket.off('newVehicleRegistration', handleNewVehicle);
      socket.off('tripAssigned', handleTripAssigned);
      socket.off('tripUnassigned', handleTripUnassigned);
      socket.off('driverLocationUpdate', handleLocationUpdate);
      socket.off('driverStoppedSharing', handleStoppedSharing);
      socket.off('locationSharingRequested', handleSharingRequested);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationSocketRef]);

  const showCompleteProfileModal =
    loaded && profile && profile.role !== 'admin' && !profile.profileComplete && !completionPromptDismissed;

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-20 sm:p-6 md:pb-6">
          <Routes>
            <Route index element={<RoleHome />} />
            <Route path="profile" element={<MyProfilePage />} />
            {role === 'driver' && (
              <>
                <Route path="trips" element={<MyTrips />} />
                <Route path="map" element={<DriverMapPage />} />
              </>
            )}
            {role === 'manager' && (
              <>
                <Route path="my-drivers" element={<DriverRoster />} />
                <Route path="vehicles" element={<VehicleList />} />
                <Route path="trips" element={<TripManagement />} />
                <Route path="map" element={<ManagerMapPage />} />
              </>
            )}
            {role === 'admin' && (
              <>
                <Route path="map" element={<AdminMapPage />} />
                <Route path="branches" element={<BranchManagement />} />
                <Route path="trips" element={<AllTripsList />} />
                <Route path="drivers" element={<DriverDirectory />} />
                <Route path="managers" element={<ManagerDirectory />} />
                <Route path="vehicles" element={<VehicleDirectory />} />
                <Route path="pending" element={<UserManagement />} />
                <Route path="analytics" element={<SystemAnalytics />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {showCompleteProfileModal && (
        <CompleteProfileModal role={profile!.role as 'driver' | 'manager'} onClose={dismissCompletionPrompt} />
      )}

      <MobileBottomNav />
    </div>
  );
}
