import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface Vehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  status: 'active' | 'maintenance' | 'retired';
  currentDriverId?: string;
  totalTrips: number;
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api
      .get('/vehicles')
      .then(({ data }) => setVehicles(data.data?.vehicles ?? []))
      .catch(() => setVehicles([]));
  }, []);

  if (vehicles.length === 0) {
    return <p className="text-sm text-gray-500">No vehicles registered yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {vehicles.map((v) => (
        <li key={v._id} className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-charcoal">{v.registrationNumber}</p>
            <p className="text-sm text-gray-500">
              {v.make} {v.model} · {v.totalTrips} trips
            </p>
          </div>
          <span className="rounded-full bg-soft-gray px-3 py-1 text-xs font-medium capitalize text-charcoal">
            {v.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
