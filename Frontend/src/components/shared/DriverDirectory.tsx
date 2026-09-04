import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { Driver, DriverUserSummary, PopulatedBranchSummary } from '@/types/driver';
import { statusLabel } from '@/utils/formatters';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from './Avatar';
import DriverDetailModal from './DriverDetailModal';

const statusStyles: Record<string, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-200 text-gray-700',
};

interface DriverDirectoryProps {
  // Omit to see every driver (admin); pass a branch id to scope the roster (manager).
  branchId?: string;
}

export default function DriverDirectory({ branchId }: DriverDirectoryProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [loadError, setLoadError] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const load = () => {
    DriverService.list({ branchId })
      .then((res) => {
        setDrivers(res.data?.drivers ?? []);
        setLoadError(false);
      })
      .catch((error) => {
        setLoadError(true);
        push(error?.response?.data?.message || 'Failed to load drivers', 'error');
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (drivers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {loadError ? 'Could not load drivers - see the error notification for details.' : 'No drivers registered yet.'}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => {
          const user = driver.userId as DriverUserSummary;
          const branch = driver.branchId as PopulatedBranchSummary | undefined;
          const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

          return (
            <button
              key={driver._id}
              onClick={() => setSelected(driver)}
              className="card flex items-center gap-3 text-left hover:border-lime"
            >
              <Avatar role="driver" photoUrl={user?.profilePhoto} name={fullName || user?.email} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-charcoal">{fullName || user?.email}</p>
                <p className="truncate text-xs text-gray-500">{branch?.name ?? 'No branch'}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[driver.status]}`}>
                  {statusLabel(driver.status)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <DriverDetailModal driver={selected} onClose={() => setSelected(null)} onReassigned={load} />
      )}
    </>
  );
}
