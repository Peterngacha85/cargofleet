import { useEffect, useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { VehicleService } from '@/services/vehicleService';
import { DriverService } from '@/services/driverService';
import { Vehicle, VehicleRegisteredBy } from '@/types/vehicle';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import VehicleForm from '@/components/shared/VehicleForm';
import SearchInput from '@/components/shared/SearchInput';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

export default function VehicleVerificationList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const push = useNotificationStore((s) => s.push);
  const setPendingVehicleCount = useApprovalsStore((s) => s.setPendingVehicleCount);
  const { user } = useAuth();
  const socketRef = useSocket('admin', { adminId: user?.id ?? '' }, !!user);

  const load = async () => {
    const response = await VehicleService.getPendingVerification();
    const list = response.data?.vehicles ?? [];
    setVehicles(list);
    setPendingVehicleCount(list.length);
  };

  useEffect(() => {
    load();
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = () => load();
    socket.on('newVehicleRegistration', handler);

    return () => {
      socket.off('newVehicleRegistration', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const handleVerify = async (vehicleId: string) => {
    const response = await VehicleService.verify(vehicleId);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) load();
  };

  const handleReject = async (vehicleId: string) => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    const response = await VehicleService.reject(vehicleId, reason);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) load();
  };

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const branchId = typeof vehicle.branchId === 'string' ? vehicle.branchId : vehicle.branchId?._id;
      const registrant = vehicle.registeredBy as VehicleRegisteredBy | undefined;

      const matchesQuery =
        !query ||
        vehicle.registrationNumber.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        `${registrant?.firstName ?? ''} ${registrant?.lastName ?? ''}`.toLowerCase().includes(query);
      const matchesBranch = !branchFilter || branchId === branchFilter;

      return matchesQuery && matchesBranch;
    });
  }, [vehicles, search, branchFilter]);

  return (
    <div className="flex flex-col gap-6">
      <VehicleForm branches={branches} onCreated={load} />

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Pending Verification</h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-500">No vehicles awaiting verification.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <SearchInput
                className="min-w-[200px] flex-1"
                value={search}
                onChange={setSearch}
                placeholder="Search by registration, make, model, or registrant…"
              />
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
              <ul className="flex flex-col gap-3">
                {filteredVehicles.map((vehicle) => {
              const registrant = vehicle.registeredBy as VehicleRegisteredBy | undefined;
              const branch = vehicle.branchId as { _id: string; name: string };
              return (
                <li key={vehicle._id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-charcoal">
                      {vehicle.registrationNumber} - {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                    <p className="text-sm text-gray-500">
                      {vehicle.capacity}kg · {vehicle.fuelType} · Branch: {branch?.name ?? '—'}
                    </p>
                    {registrant && (
                      <p className="text-xs text-gray-400">
                        Registered by {registrant.firstName} {registrant.lastName} ({registrant.email})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-primary" onClick={() => handleVerify(vehicle._id)}>
                      Verify
                    </button>
                    <button className="btn-secondary" onClick={() => handleReject(vehicle._id)}>
                      Reject
                    </button>
                  </div>
                </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
