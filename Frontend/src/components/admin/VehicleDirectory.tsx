import { useEffect, useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { VehicleService } from '@/services/vehicleService';
import { DriverService } from '@/services/driverService';
import { Vehicle } from '@/types/vehicle';
import { Branch } from '@/types/driver';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { statusLabel } from '@/utils/formatters';
import VehicleForm from '@/components/shared/VehicleForm';
import VehicleDetailModal from '@/components/shared/VehicleDetailModal';
import SearchInput from '@/components/shared/SearchInput';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  maintenance: 'bg-gray-200 text-gray-700',
  retired: 'bg-gray-200 text-gray-700',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

export default function VehicleDirectory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const setPendingVehicleCount = useApprovalsStore((s) => s.setPendingVehicleCount);

  const load = () => {
    VehicleService.list({}).then((res) => {
      const list = res.data?.vehicles ?? [];
      setVehicles(list);
      setPendingVehicleCount(list.filter((v) => v.status === 'pending_verification').length);
    });
  };

  useEffect(() => {
    load();
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const branchId = typeof vehicle.branchId === 'string' ? vehicle.branchId : vehicle.branchId?._id;

      const matchesQuery =
        !query ||
        vehicle.registrationNumber.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || vehicle.status === statusFilter;
      const matchesBranch = !branchFilter || branchId === branchFilter;

      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [vehicles, search, statusFilter, branchFilter]);

  return (
    <div className="flex flex-col gap-6">
      <VehicleForm branches={branches} onCreated={load} />

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Vehicles</h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-500">No vehicles registered yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 flex flex-wrap gap-3 bg-soft-gray pb-3">
              <SearchInput
                className="min-w-[200px] flex-1"
                value={search}
                onChange={setSearch}
                placeholder="Search by registration, make, or model…"
              />
              <Select className="w-48" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
              <Select
                className="w-44"
                value={branchFilter}
                onChange={setBranchFilter}
                options={[{ value: '', label: 'All Branches' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
              />
            </div>

            {filteredVehicles.length === 0 ? (
              <EmptyState icon={Truck} title="No matching vehicles" description="Try a different search or filter." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVehicles.map((vehicle) => {
                  const branch = vehicle.branchId as { _id: string; name: string } | undefined;
                  return (
                    <button
                      key={vehicle._id}
                      onClick={() => setSelected(vehicle)}
                      className="card flex items-center gap-3 text-left hover:border-lime"
                    >
                      {vehicle.photoUrl ? (
                        <img
                          src={vehicle.photoUrl}
                          alt={vehicle.registrationNumber}
                          className="h-14 w-20 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-md bg-soft-gray text-gray-400">
                          <Truck className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-charcoal">{vehicle.registrationNumber}</p>
                        <p className="truncate text-xs text-gray-500">
                          {vehicle.make} {vehicle.model} · {branch?.name ?? 'No branch'}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[vehicle.status]}`}
                        >
                          {statusLabel(vehicle.status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selected && <VehicleDetailModal vehicle={selected} onClose={() => setSelected(null)} onUpdated={load} />}
    </div>
  );
}
