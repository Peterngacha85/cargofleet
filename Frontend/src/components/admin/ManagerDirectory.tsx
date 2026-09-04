import { useEffect, useState } from 'react';
import { ManagerService } from '@/services/managerService';
import { Manager, ManagerUserSummary } from '@/types/manager';
import { PopulatedBranchSummary } from '@/types/driver';
import { statusLabel } from '@/utils/formatters';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from '@/components/shared/Avatar';
import ManagerDetailModal from './ManagerDetailModal';

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-200 text-gray-700',
};

export default function ManagerDirectory() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selected, setSelected] = useState<Manager | null>(null);
  const [loadError, setLoadError] = useState(false);
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    ManagerService.list({})
      .then((res) => {
        setManagers(res.data?.managers ?? []);
        setLoadError(false);
      })
      .catch((error) => {
        setLoadError(true);
        push(error?.response?.data?.message || 'Failed to load managers', 'error');
      });
  }, []);

  if (managers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {loadError ? 'Could not load managers - see the error notification for details.' : 'No managers registered yet.'}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {managers.map((manager) => {
          const user = manager.userId as ManagerUserSummary;
          const branch = manager.assignedBranchId as PopulatedBranchSummary | undefined;
          const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

          return (
            <button
              key={manager._id}
              onClick={() => setSelected(manager)}
              className="card flex items-center gap-3 text-left hover:border-lime"
            >
              <Avatar role="manager" photoUrl={user?.profilePhoto} name={fullName || user?.email} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-charcoal">{fullName || user?.email}</p>
                <p className="truncate text-xs text-gray-500">{branch?.name ?? 'No branch'}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[manager.status]}`}
                >
                  {statusLabel(manager.status)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && <ManagerDetailModal manager={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
