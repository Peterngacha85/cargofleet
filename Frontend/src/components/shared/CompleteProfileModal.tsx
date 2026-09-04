import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import {
  driverCompleteProfileSchema,
  DriverCompleteProfileValues,
  managerCompleteProfileSchema,
  ManagerCompleteProfileValues,
} from '@/utils/validators';
import { AuthService } from '@/services/authService';
import { useProfileStore } from '@/stores/profileStore';
import { useNotificationStore } from '@/stores/notificationStore';
import FieldLabel from './FieldLabel';

interface CompleteProfileModalProps {
  role: 'driver' | 'manager';
  onClose: () => void;
}

export default function CompleteProfileModal({ role, onClose }: CompleteProfileModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const push = useNotificationStore((s) => s.push);
  const isDriver = role === 'driver';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverCompleteProfileValues | ManagerCompleteProfileValues>({
    resolver: zodResolver(isDriver ? driverCompleteProfileSchema : managerCompleteProfileSchema),
  });

  const onSubmit = async (values: DriverCompleteProfileValues | ManagerCompleteProfileValues) => {
    setSubmitting(true);
    try {
      const response = await AuthService.completeProfile(values);
      if (response.success) {
        push('Profile completed', 'success');
        await fetchProfile();
        onClose();
      } else {
        push(response.message || 'Failed to update profile', 'error');
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // z-[9999]: Leaflet's internal map panes/controls use z-index up to 1000 and aren't
    // contained in their own stacking context, so a lower value here gets covered once the map loads.
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-charcoal"
          aria-label="Remind me later"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-bold text-charcoal">Complete your profile</h2>
        <p className="mb-4 text-sm text-gray-500">
          {isDriver
            ? "You signed up with Google, so we're missing a few details. Add them below to get assigned trips."
            : "You signed up with Google, so we're missing your phone number. Add it below."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <FieldLabel required>Phone</FieldLabel>
            <input placeholder="+254712345678" className="input-field" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          {isDriver && (
            <>
              <div>
                <FieldLabel required>Driving License Number</FieldLabel>
                <input className="input-field" {...register('drivingLicenseNumber' as any)} />
              </div>
              <div>
                <FieldLabel required>License Expiry</FieldLabel>
                <input type="date" className="input-field" {...register('licenseExpiry' as any)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Emergency Contact Name</FieldLabel>
                  <input className="input-field" {...register('emergencyContactName' as any)} />
                </div>
                <div>
                  <FieldLabel required>Emergency Contact Phone</FieldLabel>
                  <input className="input-field" {...register('emergencyContactPhone' as any)} />
                </div>
              </div>
            </>
          )}

          {Object.values(errors).map((err, i) => (
            <p key={i} className="text-sm text-red-600">
              {err?.message as string}
            </p>
          ))}

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="text-sm text-gray-500 underline">
              Remind me later
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
