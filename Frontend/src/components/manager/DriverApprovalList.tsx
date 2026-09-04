import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { Driver, Branch, DriverUserSummary } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';

export default function DriverApprovalList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Record<string, string>>({});
  const push = useNotificationStore((s) => s.push);

  const load = async () => {
    const [driversRes, branchesRes] = await Promise.all([
      DriverService.getPendingApproval(),
      DriverService.getBranches(),
    ]);
    setDrivers(driversRes.data?.drivers ?? []);
    setBranches(branchesRes.data?.branches ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (driverId: string) => {
    const branchId = selectedBranch[driverId];
    if (!branchId) {
      push('Select a branch before approving', 'warning');
      return;
    }
    const response = await DriverService.approve(driverId, branchId);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) setDrivers((prev) => prev.filter((d) => d._id !== driverId));
  };

  const handleReject = async (driverId: string) => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    const response = await DriverService.reject(driverId, reason);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) setDrivers((prev) => prev.filter((d) => d._id !== driverId));
  };

  if (drivers.length === 0) {
    return <p className="text-sm text-gray-500">No pending driver registrations.</p>;
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
              <select
                className="input-field w-40"
                value={selectedBranch[driver._id] ?? ''}
                onChange={(e) => setSelectedBranch((prev) => ({ ...prev, [driver._id]: e.target.value }))}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
