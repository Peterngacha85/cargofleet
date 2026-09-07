import { useState } from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import DetailField from './DetailField';
import FieldLabel from './FieldLabel';
import Select from './Select';
import FuelLogHistory from './FuelLogHistory';
import { VehicleService } from '@/services/vehicleService';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/profileStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Vehicle, VehicleType, FuelType } from '@/types/vehicle';
import { statusLabel } from '@/utils/formatters';

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onUpdated: () => void;
}

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  maintenance: 'bg-gray-200 text-gray-700',
  retired: 'bg-gray-200 text-gray-700',
};

const vehicleTypes: VehicleType[] = ['motorcycle', 'van', 'truck', 'lorry'];
const fuelTypes: FuelType[] = ['petrol', 'diesel', 'electric'];

// yyyy-mm-dd for a date input's value, from an ISO string or undefined.
const toDateInputValue = (value?: string) => (value ? value.slice(0, 10) : '');

function ExpiryField({ label, value }: { label: string; value?: string }) {
  if (!value) return <DetailField label={label} value={undefined} />;

  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  const badgeClass =
    days < 0 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700';

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-charcoal">
        {new Date(value).toLocaleDateString()}
        {days <= 30 && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            <AlertTriangle className="h-3 w-3" />
            {days < 0 ? 'Expired' : `${days}d left`}
          </span>
        )}
      </p>
    </div>
  );
}

export default function VehicleDetailModal({ vehicle, onClose, onUpdated }: VehicleDetailModalProps) {
  const { role } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const push = useNotificationStore((s) => s.push);
  const branch = vehicle.branchId as { _id: string; name: string } | undefined;
  const branchId = typeof vehicle.branchId === 'string' ? vehicle.branchId : vehicle.branchId?._id;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    vehicleType: vehicle.vehicleType,
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    capacity: String(vehicle.capacity),
    fuelType: vehicle.fuelType,
    maintenanceDue: toDateInputValue(vehicle.maintenanceDue),
    lastServiceDate: toDateInputValue(vehicle.lastServiceDate),
    insuranceExpiry: toDateInputValue(vehicle.documents?.insuranceExpiry),
    registrationExpiry: toDateInputValue(vehicle.documents?.registrationExpiry),
    inspectionExpiry: toDateInputValue(vehicle.documents?.inspectionExpiry),
  });

  const myBranchId = profile?.manager?.assignedBranchId;
  // A manager may only edit their own branch's vehicles; admin (the verifying authority)
  // can edit any of them.
  const canEdit = role === 'admin' || (role === 'manager' && !!myBranchId && myBranchId === branchId);
  const canVerify = role === 'admin' && vehicle.status === 'pending_verification';

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await VehicleService.update(vehicle._id, {
        vehicleType: form.vehicleType,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        capacity: Number(form.capacity),
        fuelType: form.fuelType,
        photo: photo ?? undefined,
        maintenanceDue: form.maintenanceDue || undefined,
        lastServiceDate: form.lastServiceDate || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        registrationExpiry: form.registrationExpiry || undefined,
        inspectionExpiry: form.inspectionExpiry || undefined,
      });
      push(
        response.success
          ? role === 'manager'
            ? 'Vehicle updated - sent for super admin re-verification.'
            : 'Vehicle updated.'
          : response.message,
        response.success ? 'success' : 'error'
      );
      if (response.success) {
        onUpdated();
        onClose();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to update vehicle', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    const response = await VehicleService.verify(vehicle._id);
    push(response.message, response.success ? 'success' : 'error');
    if (response.success) {
      onUpdated();
      onClose();
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection?') ?? 'Not specified';
    setRejecting(true);
    try {
      const response = await VehicleService.reject(vehicle._id, reason);
      push(response.message, response.success ? 'success' : 'error');
      if (response.success) {
        onUpdated();
        onClose();
      }
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidthClass="max-w-lg">
      <div className="mb-4 flex items-center gap-4">
        {vehicle.photoUrl ? (
          <img
            src={vehicle.photoUrl}
            alt={vehicle.registrationNumber}
            className="h-20 w-28 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-20 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-soft-gray text-gray-400">
            <Truck className="h-8 w-8" />
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-charcoal">{vehicle.registrationNumber}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[vehicle.status]}`}>
            {statusLabel(vehicle.status)}
          </span>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Type" value={statusLabel(vehicle.vehicleType)} />
            <DetailField label="Make & Model" value={`${vehicle.make} ${vehicle.model} (${vehicle.year})`} />
            <DetailField label="Capacity" value={`${vehicle.capacity} kg`} />
            <DetailField label="Fuel Type" value={statusLabel(vehicle.fuelType)} />
            <DetailField label="Branch" value={branch?.name} />
            <DetailField label="Total Trips" value={vehicle.totalTrips} />
            <DetailField label="Registered By" value={vehicle.registeredByName} />
            <DetailField label="Verified By" value={vehicle.verifiedByName} />
            <ExpiryField label="Next Service Due" value={vehicle.maintenanceDue} />
            <DetailField
              label="Last Service Date"
              value={vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : undefined}
            />
            <ExpiryField label="Insurance Expiry" value={vehicle.documents?.insuranceExpiry} />
            <ExpiryField label="Registration Expiry" value={vehicle.documents?.registrationExpiry} />
            <ExpiryField label="Inspection Expiry" value={vehicle.documents?.inspectionExpiry} />
          </div>

          {vehicle.status === 'rejected' && vehicle.rejectionReason && (
            <p className="mt-4 text-sm text-red-600">Rejection reason: {vehicle.rejectionReason}</p>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-charcoal">Fuel</h3>
            <FuelLogHistory vehicleId={vehicle._id} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {canEdit && (
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
            {canVerify && (
              <>
                <button className="btn-primary" onClick={handleVerify}>
                  Verify
                </button>
                <button className="btn-secondary" onClick={handleReject} disabled={rejecting}>
                  {rejecting ? 'Rejecting…' : 'Reject'}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                value={form.make}
                onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel required>Model</FieldLabel>
              <input
                className="input-field"
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
            <div className="sm:col-span-2">
              <FieldLabel>Replace Photo</FieldLabel>
              <input
                type="file"
                accept="image/*"
                className="input-field"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <p className="mb-3 mt-5 text-sm font-semibold text-charcoal">Maintenance &amp; Documents</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Next Service Due</FieldLabel>
              <input
                type="date"
                className="input-field"
                value={form.maintenanceDue}
                onChange={(e) => setForm((f) => ({ ...f, maintenanceDue: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Last Service Date</FieldLabel>
              <input
                type="date"
                className="input-field"
                value={form.lastServiceDate}
                onChange={(e) => setForm((f) => ({ ...f, lastServiceDate: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Insurance Expiry</FieldLabel>
              <input
                type="date"
                className="input-field"
                value={form.insuranceExpiry}
                onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Registration Expiry</FieldLabel>
              <input
                type="date"
                className="input-field"
                value={form.registrationExpiry}
                onChange={(e) => setForm((f) => ({ ...f, registrationExpiry: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Inspection Expiry</FieldLabel>
              <input
                type="date"
                className="input-field"
                value={form.inspectionExpiry}
                onChange={(e) => setForm((f) => ({ ...f, inspectionExpiry: e.target.value }))}
              />
            </div>
          </div>

          {role === 'manager' && (
            <p className="mt-3 text-xs text-gray-400">
              Saving changes sends this vehicle back for super admin re-verification.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
