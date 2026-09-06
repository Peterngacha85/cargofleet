import { useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { ManagerService } from '@/services/managerService';
import { DriverService } from '@/services/driverService';
import { Manager, ManagerUserSummary } from '@/types/manager';
import { PopulatedBranchSummary, Branch } from '@/types/driver';
import { statusLabel } from '@/utils/formatters';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from '@/components/shared/Avatar';
import SearchInput from '@/components/shared/SearchInput';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';
import ManagerDetailModal from './ManagerDetailModal';

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-200 text-gray-700',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'inactive', label: 'Inactive' },
];

export default function ManagerDirectory() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Manager | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
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
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
  }, []);

  const filteredManagers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return managers.filter((manager) => {
      const user = manager.userId as ManagerUserSummary;
      const branch = manager.assignedBranchId as PopulatedBranchSummary | string | undefined;
      const managerBranchId = typeof branch === 'string' ? branch : branch?._id;
      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().toLowerCase();

      const matchesQuery =
        !query || fullName.includes(query) || user?.email?.toLowerCase().includes(query) || user?.phone?.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || manager.status === statusFilter;
      const matchesBranch = !branchFilter || managerBranchId === branchFilter;

      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [managers, search, statusFilter, branchFilter]);

  if (managers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {loadError ? 'Could not load managers - see the error notification for details.' : 'No managers registered yet.'}
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
          placeholder="Search by name, email, or phone…"
        />
        <Select className="w-44" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <Select
          className="w-44"
          value={branchFilter}
          onChange={setBranchFilter}
          options={[{ value: '', label: 'All Branches' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
        />
      </div>

      {filteredManagers.length === 0 ? (
        <EmptyState icon={UsersRound} title="No matching managers" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredManagers.map((manager) => {
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
      )}

      {selected && <ManagerDetailModal manager={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
