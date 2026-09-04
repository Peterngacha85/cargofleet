import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import CompleteProfileModal from '@/components/shared/CompleteProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/profileStore';
import DriverDashboard from '@/components/driver/DriverDashboard';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import AdminPanel from '@/components/admin/AdminPanel';
import DriverApprovalList from '@/components/manager/DriverApprovalList';
import VehicleList from '@/components/manager/VehicleList';
import BranchManagement from '@/components/admin/BranchManagement';
import UserManagement from '@/components/admin/UserManagement';
import MyProfilePage from './MyProfilePage';

function RoleHome() {
  const { role } = useAuth();
  if (role === 'admin') return <AdminPanel />;
  if (role === 'manager') return <ManagerDashboard />;
  return <DriverDashboard />;
}

export default function DashboardPage() {
  const { role } = useAuth();
  const { profile, loaded, fetchProfile, completionPromptDismissed, dismissCompletionPrompt } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {role === 'manager' && (
              <>
                <Route path="drivers" element={<DriverApprovalList />} />
                <Route path="vehicles" element={<VehicleList />} />
              </>
            )}
            {role === 'admin' && (
              <>
                <Route path="branches" element={<BranchManagement />} />
                <Route path="managers" element={<UserManagement />} />
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
