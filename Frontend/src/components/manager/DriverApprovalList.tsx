import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DriverService } from '@/services/driverService';
import { Driver, Branch, DriverUserSummary } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

export default function DriverApprovalList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Record<string, string>>({});
  const push = useNotificationStore((s) => s.push);
  const setPendingDriverCount = useApprovalsStore((s) => s.setPendingDriverCount);
  const { user } = useAuth();
  const socketRef = useSocket('manager', { managerId: user?.id ?? '' }, !!user);

  const load = async () => {
    const [driversRes, branchesRes] = await Promise.all([
      DriverService.getPendingApproval(),
      DriverService.getBranches(),
    ]);
    const list = driversRes.data?.drivers ?? [];
    setDrivers(list);
    setBranches(branchesRes.data?.branches ?? []);
    setPendingDriverCount(list.length);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Keep this list live while it's open - a badge elsewhere won't refresh what's on screen here.
    const handler = () => load();
    socket.on('newDriverRegistration', handler);

    return () => {
      socket.off('newDriverRegistration', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const handleApprove = async (driverId: string) => {
    const branchId = selectedBranch[driverId];
    if (!branchId) {
      push('Select a branch before approving', 'warning');
      return;
    }
    const response = await DriverService.approve(driverId, branchId);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) load();
  };

  const handleReject = async (driverId: string) => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    const response = await DriverService.reject(driverId, reason);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) load();
  };

  if (drivers.length === 0) {
    return <EmptyState icon={CheckCircle2} title="All caught up" description="No pending driver registrations." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {drivers.map((driver) => {
        const userInfo = driver.userId as DriverUserSummary;
        return (
          <li key={driver._id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-charcoal">
                {userInfo?.firstName} {userInfo?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {userInfo?.email} · License: {driver.drivingLicenseNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                className="w-40"
                value={selectedBranch[driver._id] ?? ''}
                onChange={(v) => setSelectedBranch((prev) => ({ ...prev, [driver._id]: v }))}
                placeholder="Select branch"
                options={branches.map((b) => ({ value: b._id, label: b.name }))}
              />
              <button className="btn-primary" onClick={() => handleApprove(driver._id)}>
                Approve
              </button>
              <button className="btn-secondary" onClick={() => handleReject(driver._id)}>
                Reject
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
