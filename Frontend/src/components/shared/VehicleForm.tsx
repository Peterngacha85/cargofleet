import { useState } from 'react';
import { VehicleService } from '@/services/vehicleService';
import { VehicleType, FuelType } from '@/types/vehicle';
import { Branch } from '@/types/driver';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel } from '@/utils/formatters';
import FieldLabel from './FieldLabel';
import Select from './Select';

const vehicleTypes: VehicleType[] = ['motorcycle', 'van', 'truck', 'lorry'];
const fuelTypes: FuelType[] = ['petrol', 'diesel', 'electric'];

const emptyForm = {
  registrationNumber: '',
  vehicleType: 'van' as VehicleType,
  make: '',
  model: '',
  year: '',
  capacity: '',
  fuelType: 'diesel' as FuelType,
};

interface VehicleFormProps {
  // Manager case: branch is fixed to their own assignment, no picker shown.
  branchId?: string;
  // Admin case: no fixed branch, so a picker is shown instead - pass the branch list for it.
  branches?: Branch[];
  onCreated: () => void;
}

export default function VehicleForm({ branchId, branches, onCreated }: VehicleFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const isAdminMode = !branchId;
  const effectiveBranchId = branchId || selectedBranchId;

  const handleCreate = async () => {
    if (!effectiveBranchId) {
      push(
        isAdminMode ? 'Select a branch before adding a vehicle.' : 'Your branch assignment is still loading - try again in a moment.',
        'warning'
      );
      return;
    }
    if (!form.registrationNumber || !form.make || !form.model || !form.year || !form.capacity) {
      push('Fill in all vehicle fields before submitting.', 'warning');
      return;
    }
    if (!photo) {
      push('Add a photo of the vehicle before submitting.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await VehicleService.create({
        registrationNumber: form.registrationNumber,
        vehicleType: form.vehicleType,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        capacity: Number(form.capacity),
        fuelType: form.fuelType,
        branchId: effectiveBranchId,
        photo,
      });
      push(
        response.success
          ? isAdminMode
            ? 'Vehicle added'
            : 'Vehicle submitted for super admin verification'
          : response.message,
        response.success ? 'success' : 'error'
      );
      if (response.success) {
        setForm(emptyForm);
        setPhoto(null);
        onCreated();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to add vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-4 font-semibold text-charcoal">Add Vehicle</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isAdminMode && (
          <div>
            <FieldLabel required>Branch</FieldLabel>
            <Select
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              placeholder="Select branch"
              options={(branches ?? []).map((b) => ({ value: b._id, label: b.name }))}
            />
          </div>
        )}
        <div>
          <FieldLabel required>Registration Number</FieldLabel>
          <input
            className="input-field"
            value={form.registrationNumber}
            onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel required>Vehicle Type</FieldLabel>
          <Select
            value={form.vehicleType}
            onChange={(v) => setForm((f) => ({ ...f, vehicleType: v as VehicleType }))}
            options={vehicleTypes.map((t) => ({ value: t, label: statusLabel(t) }))}
          />
        </div>
        <div>
          <FieldLabel required>Fuel Type</FieldLabel>
          <Select
            value={form.fuelType}
            onChange={(v) => setForm((f) => ({ ...f, fuelType: v as FuelType }))}
            options={fuelTypes.map((t) => ({ value: t, label: statusLabel(t) }))}
          />
        </div>
        <div>
          <FieldLabel required>Make</FieldLabel>
          <input
            className="input-field"
            placeholder="Toyota"
            value={form.make}
            onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel required>Model</FieldLabel>
          <input
            className="input-field"
            placeholder="Hiace"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel required>Year</FieldLabel>
          <input
            type="number"
            className="input-field"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel required>Capacity (kg)</FieldLabel>
          <input
            type="number"
            className="input-field"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel required>Photo</FieldLabel>
          <input
            type="file"
            accept="image/*"
            className="input-field"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <button className="btn-primary mt-4" onClick={handleCreate} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Add Vehicle'}
      </button>
      {!isAdminMode && (
        <p className="mt-2 text-xs text-gray-400">
          New vehicles are unusable (can't be assigned or put on a trip) until a super admin verifies them.
        </p>
      )}
    </div>
  );
}
