import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import CompleteProfileModal from '@/components/shared/CompleteProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useLocation } from '@/hooks/useLocation';
import { useProfileStore } from '@/stores/profileStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTripTrackingStore } from '@/stores/tripTrackingStore';
import DriverDashboard from '@/components/driver/DriverDashboard';
import MyTrips from '@/components/driver/MyTrips';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import AdminPanel from '@/components/admin/AdminPanel';
import DriverApprovalList from '@/components/manager/DriverApprovalList';
import DriverRoster from '@/components/manager/DriverRoster';
import VehicleList from '@/components/manager/VehicleList';
import TripManagement from '@/components/manager/TripManagement';
import BranchManagement from '@/components/admin/BranchManagement';
import UserManagement from '@/components/admin/UserManagement';
import VehicleVerificationList from '@/components/admin/VehicleVerificationList';
import MyProfilePage from './MyProfilePage';

function RoleHome() {
  const { role } = useAuth();
  if (role === 'admin') return <AdminPanel />;
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
  const { position } = useLocation(role === 'driver' && !!activeTripId);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!position) return;
    setTrackedPosition(position);
  }, [position, setTrackedPosition]);

  useEffect(() => {
    if (!position || !activeTripId) return;
    const socket = registrationSocketRef.current;
    if (!socket) return;

    socket.emit('sendLocation', {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed ?? 0,
      heading: position.heading ?? 0,
      tripId: activeTripId,
    });
  }, [position, activeTripId, registrationSocketRef]);

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

    socket.on('newDriverRegistration', handleNewDriver);
    socket.on('newManagerRegistration', handleNewManager);
    socket.on('newVehicleRegistration', handleNewVehicle);
    socket.on('tripAssigned', handleTripAssigned);

    return () => {
      socket.off('newDriverRegistration', handleNewDriver);
      socket.off('newManagerRegistration', handleNewManager);
      socket.off('newVehicleRegistration', handleNewVehicle);
      socket.off('tripAssigned', handleTripAssigned);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationSocketRef]);

  const showCompleteProfileModal =
    loaded && profile && profile.role !== 'admin' && !profile.profileComplete && !completionPromptDismissed;

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<RoleHome />} />
            <Route path="profile" element={<MyProfilePage />} />
            {role === 'driver' && <Route path="trips" element={<MyTrips />} />}
            {role === 'manager' && (
              <>
                <Route path="drivers" element={<DriverApprovalList />} />
                <Route path="my-drivers" element={<DriverRoster />} />
                <Route path="vehicles" element={<VehicleList />} />
                <Route path="trips" element={<TripManagement />} />
              </>
            )}
            {role === 'admin' && (
              <>
                <Route path="branches" element={<BranchManagement />} />
                <Route path="managers" element={<UserManagement />} />
                <Route path="vehicles" element={<VehicleVerificationList />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {showCompleteProfileModal && (
        <CompleteProfileModal role={profile!.role as 'driver' | 'manager'} onClose={dismissCompletionPrompt} />
      )}
    </div>
  );
}
