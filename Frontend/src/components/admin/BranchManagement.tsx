import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { api } from '@/services/api';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: '', city: '', latitude: '', longitude: '', address: '', phone: '' });
  const push = useNotificationStore((s) => s.push);

  const load = () => DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      const { data } = await api.post('/branches', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      push(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        setForm({ name: '', city: '', latitude: '', longitude: '', address: '', phone: '' });
        load();
      }
    } catch {
      push('Failed to create branch', 'error');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!window.confirm('Delete this branch?')) return;
    const { data } = await api.delete(`/branches/${branchId}`);
    push(data.message, data.success ? 'success' : 'error');
    if (data.success) load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(['name', 'city', 'latitude', 'longitude', 'address', 'phone'] as const).map((field) => (
          <input
            key={field}
            className="input-field"
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          />
        ))}
        <button className="btn-primary col-span-2 sm:col-span-3" onClick={handleCreate}>
          Add Branch
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {branches.map((b) => (
          <li key={b._id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal">{b.name}</p>
              <p className="text-sm text-gray-500">
                {b.city} · {b.driverCount} drivers · {b.vehicleCount} vehicles
              </p>
            </div>
            <button className="btn-secondary" onClick={() => handleDelete(b._id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
