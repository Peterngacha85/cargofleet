import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { VehicleService } from '@/services/vehicleService';
import { Vehicle } from '@/types/vehicle';
import { useProfileStore } from '@/stores/profileStore';
import { statusLabel } from '@/utils/formatters';
import VehicleForm from '@/components/shared/VehicleForm';
import VehicleDetailModal from '@/components/shared/VehicleDetailModal';

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  maintenance: 'bg-gray-200 text-gray-700',
  retired: 'bg-gray-200 text-gray-700',
};

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <button
              key={v._id}
              onClick={() => setSelected(v)}
              className="card flex items-center gap-3 text-left hover:border-lime"
            >
              {v.photoUrl ? (
                <img src={v.photoUrl} alt={v.registrationNumber} className="h-14 w-20 flex-shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-md bg-soft-gray text-gray-400">
                  <Truck className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-charcoal">{v.registrationNumber}</p>
                <p className="truncate text-xs text-gray-500">
                  {v.make} {v.model} · {v.totalTrips} trips
                </p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[v.status]}`}>
                  {statusLabel(v.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <VehicleDetailModal vehicle={selected} onClose={() => setSelected(null)} onUpdated={load} />}
    </div>
  );
}
