import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DriverService } from '@/services/driverService';
import { Driver, DriverUserSummary } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { confirmDialog } from '@/stores/dialogStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import EmptyState from '@/components/shared/EmptyState';

export default function DriverDeletionRequests() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const push = useNotificationStore((s) => s.push);
  const setPendingDriverDeletionCount = useApprovalsStore((s) => s.setPendingDriverDeletionCount);
  const { user } = useAuth();
  const socketRef = useSocket('admin', { adminId: user?.id ?? '' }, !!user);

  const load = () => {
    DriverService.getPendingDeletion().then((res) => {
      const list = res.data?.drivers ?? [];
      setDrivers(list);
      setPendingDriverDeletionCount(list.length);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = () => load();
    socket.on('driverDeletionRequested', handler);

    return () => {
      socket.off('driverDeletionRequested', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const handleDelete = async (driver: Driver) => {
    const user_ = driver.userId as DriverUserSummary;
    const fullName = `${user_?.firstName ?? ''} ${user_?.lastName ?? ''}`.trim();
    const confirmed = await confirmDialog({
      title: 'Delete driver',
      message: `Delete ${fullName || user_?.email}? This can be undone by a super admin later.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    setActingOn(driver._id);
    try {
      const response = await DriverService.delete(driver._id);
      push(response.success ? 'Driver deleted.' : response.message, response.success ? 'success' : 'error');
      if (response.success) load();
    } finally {
      setActingOn(null);
    }
  };

  const handleDismiss = async (driver: Driver) => {
    setActingOn(driver._id);
    try {
      const response = await DriverService.dismissDeletionRequest(driver._id);
      push(response.success ? 'Deletion request dismissed.' : response.message, response.success ? 'success' : 'error');
      if (response.success) load();
    } finally {
      setActingOn(null);
    }
  };

  if (drivers.length === 0) {
    return <EmptyState icon={CheckCircle2} title="All caught up" description="No pending deletion requests." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {drivers.map((driver) => {
        const driverUser = driver.userId as DriverUserSummary;
        const fullName = `${driverUser?.firstName ?? ''} ${driverUser?.lastName ?? ''}`.trim();
        return (
          <li key={driver._id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-charcoal">{fullName || driverUser?.email}</p>
              <p className="text-sm text-gray-500">{driverUser?.email}</p>
              <p className="mt-1 text-xs text-gray-400">
                Requested by {driver.deletionRequestedByName ?? 'a manager'}
                {driver.deletionReason && `: ${driver.deletionReason}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                onClick={() => handleDismiss(driver)}
                disabled={actingOn === driver._id}
              >
                Dismiss
              </button>
              <button
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => handleDelete(driver)}
                disabled={actingOn === driver._id}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
