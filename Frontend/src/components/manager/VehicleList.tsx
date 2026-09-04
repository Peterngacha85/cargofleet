import { useEffect, useState } from 'react';
import { VehicleService } from '@/services/vehicleService';
import { Vehicle } from '@/types/vehicle';
import { useProfileStore } from '@/stores/profileStore';
import { statusLabel } from '@/utils/formatters';
import VehicleForm from '@/components/shared/VehicleForm';

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  maintenance: 'bg-gray-200 text-gray-700',
  retired: 'bg-gray-200 text-gray-700',
};

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const profile = useProfileStore((s) => s.profile);
  const branchId = profile?.manager?.assignedBranchId;

  const load = () => {
    VehicleService.list({ branchId })
      .then((res) => setVehicles(res.data?.vehicles ?? []))
      .catch(() => setVehicles([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  return (
    <div className="flex flex-col gap-6">
      <VehicleForm branchId={branchId} onCreated={load} />

      {vehicles.length === 0 ? (
        <p className="text-sm text-gray-500">No vehicles registered yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map((v) => (
            <li key={v._id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-charcoal">{v.registrationNumber}</p>
                <p className="text-sm text-gray-500">
                  {v.make} {v.model} · {v.totalTrips} trips
                </p>
                {v.status === 'rejected' && v.rejectionReason && (
                  <p className="text-xs text-red-600">Reason: {v.rejectionReason}</p>
                )}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[v.status]}`}>
                {statusLabel(v.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
