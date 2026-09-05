import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { DriverService } from '@/services/driverService';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

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
  const setPendingManagerCount = useApprovalsStore((s) => s.setPendingManagerCount);
  const { user } = useAuth();
  const socketRef = useSocket('admin', { adminId: user?.id ?? '' }, !!user);

  const load = async () => {
    const [managersRes, branchesRes] = await Promise.all([
      api.get('/managers/pending-verification'),
      DriverService.getBranches(),
    ]);
    const list = managersRes.data.data?.managers ?? [];
    setManagers(list);
    setBranches(branchesRes.data?.branches ?? []);
    setPendingManagerCount(list.length);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = () => load();
    socket.on('newManagerRegistration', handler);

    return () => {
      socket.off('newManagerRegistration', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const handleVerify = async (managerId: string) => {
    const branchId = selectedBranch[managerId];
    if (!branchId) {
      push('Select a branch before verifying', 'warning');
      return;
    }
    const { data } = await api.post(`/managers/${managerId}/verify`, { branchId });
    push(data.message, data.success ? 'success' : 'error');
    if (data.success) load();
  };

  const handleReject = async (managerId: string) => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    const { data } = await api.post(`/managers/${managerId}/reject`, { rejectionReason: reason });
    push(data.message, data.success ? 'success' : 'error');
    if (data.success) load();
  };

  if (managers.length === 0) {
    return <EmptyState icon={CheckCircle2} title="All caught up" description="No pending manager registrations." />;
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
            <Select
              className="w-40"
              value={selectedBranch[manager._id] ?? ''}
              onChange={(v) => setSelectedBranch((prev) => ({ ...prev, [manager._id]: v }))}
              placeholder="Assign branch"
              options={branches.map((b) => ({ value: b._id, label: b.name }))}
            />
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
