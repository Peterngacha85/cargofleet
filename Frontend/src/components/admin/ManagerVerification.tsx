import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { DriverService } from '@/services/driverService';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';

interface PendingManager {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  status: string;
}

export default function ManagerVerification() {
  const [managers, setManagers] = useState<PendingManager[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Record<string, string>>({});
  const push = useNotificationStore((s) => s.push);

  const load = async () => {
    const [managersRes, branchesRes] = await Promise.all([
      api.get('/managers/pending-verification'),
      DriverService.getBranches(),
    ]);
    setManagers(managersRes.data.data?.managers ?? []);
    setBranches(branchesRes.data?.branches ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (managerId: string) => {
    const branchId = selectedBranch[managerId];
    if (!branchId) {
      push('Select a branch before verifying', 'warning');
      return;
    }
    const { data } = await api.post(`/managers/${managerId}/verify`, { branchId });
    push(data.message, data.success ? 'success' : 'error');
    if (data.success) setManagers((prev) => prev.filter((m) => m._id !== managerId));
  };

  const handleReject = async (managerId: string) => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    const { data } = await api.post(`/managers/${managerId}/reject`, { rejectionReason: reason });
    push(data.message, data.success ? 'success' : 'error');
    if (data.success) setManagers((prev) => prev.filter((m) => m._id !== managerId));
  };

  if (managers.length === 0) {
    return <p className="text-sm text-gray-500">No pending manager registrations.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {managers.map((manager) => (
        <li key={manager._id} className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-charcoal">
              {manager.userId.firstName} {manager.userId.lastName}
            </p>
            <p className="text-sm text-gray-500">{manager.userId.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input-field w-40"
              value={selectedBranch[manager._id] ?? ''}
              onChange={(e) => setSelectedBranch((prev) => ({ ...prev, [manager._id]: e.target.value }))}
            >
              <option value="">Assign branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => handleVerify(manager._id)}>
              Verify
            </button>
            <button className="btn-secondary" onClick={() => handleReject(manager._id)}>
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
