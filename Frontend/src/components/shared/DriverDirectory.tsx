import { useEffect, useMemo, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { Driver, DriverUserSummary, PopulatedBranchSummary, Branch } from '@/types/driver';
import { statusLabel } from '@/utils/formatters';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from './Avatar';
import DriverDetailModal from './DriverDetailModal';
import SearchInput from './SearchInput';
import Select from './Select';
import EmptyState from './EmptyState';
import { Users } from 'lucide-react';

const statusStyles: Record<string, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-200 text-gray-700',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

interface DriverDirectoryProps {
  // Omit to see every driver (admin); pass a branch id to scope the roster (manager).
  branchId?: string;
}

export default function DriverDirectory({ branchId }: DriverDirectoryProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
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
    // Admin (no fixed branchId) gets a branch filter - a manager is already scoped to one.
    if (!branchId) {
      DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const user = driver.userId as DriverUserSummary;
      const driverBranch = driver.branchId as PopulatedBranchSummary | string | undefined;
      const driverBranchId = typeof driverBranch === 'string' ? driverBranch : driverBranch?._id;
      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().toLowerCase();

      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        user?.email?.toLowerCase().includes(query) ||
        user?.phone?.toLowerCase().includes(query) ||
        driver.drivingLicenseNumber?.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || driver.status === statusFilter;
      const matchesBranch = !branchFilter || driverBranchId === branchFilter;

      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [drivers, search, statusFilter, branchFilter]);

  if (drivers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {loadError ? 'Could not load drivers - see the error notification for details.' : 'No drivers registered yet.'}
      </p>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap gap-3 bg-soft-gray pb-3">
        <SearchInput
          className="min-w-[200px] flex-1"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, phone, or license…"
        />
        <Select className="w-44" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        {!branchId && (
          <Select
            className="w-44"
            value={branchFilter}
            onChange={setBranchFilter}
            options={[{ value: '', label: 'All Branches' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
          />
        )}
      </div>

      {filteredDrivers.length === 0 ? (
        <EmptyState icon={Users} title="No matching drivers" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDrivers.map((driver) => {
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
                  {driver.deletionRequested && (
                    <span className="mt-1 ml-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      Deletion requested
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <DriverDetailModal
          driver={selected}
          onClose={() => setSelected(null)}
          onReassigned={load}
          onDeleted={load}
        />
      )}
    </>
  );
}
