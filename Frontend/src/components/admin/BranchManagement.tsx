import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { DriverService } from '@/services/driverService';
import { api } from '@/services/api';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { geocodeAddress } from '@/utils/geocode';
import FieldLabel from '@/components/shared/FieldLabel';

const emptyForm = { name: '', city: '', address: '', latitude: '', longitude: '', phone: '' };

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [geocoding, setGeocoding] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const load = () => DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));

  useEffect(() => {
    load();
  }, []);

  const handleFindCoordinates = async () => {
    if (!form.address) {
      push('Type an address first, then find its coordinates.', 'warning');
      return;
    }

    setGeocoding(true);
    try {
      const result = await geocodeAddress(form.address);
      if (!result) {
        push(`Couldn't find coordinates for "${form.address}" - try a more specific address, or enter them manually.`, 'warning');
        return;
      }
      setForm((f) => ({ ...f, latitude: String(result.latitude), longitude: String(result.longitude) }));
      push(`Found: ${result.displayName}`, 'success');
    } catch {
      push('Coordinate lookup failed - enter them manually instead.', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await api.post('/branches', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      push(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        setForm(emptyForm);
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
      <div className="card">
        <h2 className="mb-4 font-semibold text-charcoal">Add Branch</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Name</FieldLabel>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel required>City</FieldLabel>
            <input
              className="input-field"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel required>Address</FieldLabel>
            <div className="flex gap-2">
              <input
                className="input-field"
                placeholder="e.g. Nairobi CBD, or a full street address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
              <button
                type="button"
                className="btn-secondary flex items-center gap-1 whitespace-nowrap"
                onClick={handleFindCoordinates}
                disabled={geocoding}
              >
                <MapPin className="h-4 w-4" />
                {geocoding ? '…' : 'Find'}
              </button>
            </div>
          </div>
          <div>
            <FieldLabel required>Latitude</FieldLabel>
            <input
              type="number"
              step="any"
              className="input-field"
              value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel required>Longitude</FieldLabel>
            <input
              type="number"
              step="any"
              className="input-field"
              value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
            />
          </div>
          <p className="-mt-1 text-xs text-gray-400 sm:col-span-2">
            Type the address above and click Find to fill these in automatically, or enter them by hand.
          </p>
          <div>
            <FieldLabel required>Phone</FieldLabel>
            <input
              className="input-field"
              placeholder="+254712345678"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleCreate}>
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
