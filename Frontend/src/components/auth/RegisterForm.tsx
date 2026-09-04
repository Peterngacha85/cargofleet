import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  driverRegisterSchema,
  DriverRegisterFormValues,
  managerRegisterSchema,
  ManagerRegisterFormValues,
} from '@/utils/validators';
import { AuthService } from '@/services/authService';
import { useNotificationStore } from '@/stores/notificationStore';
import PasswordInput from '@/components/shared/PasswordInput';
import FieldLabel from '@/components/shared/FieldLabel';

interface RegisterFormProps {
  role: 'driver' | 'manager';
}

export default function RegisterForm({ role }: RegisterFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();
  const isDriver = role === 'driver';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverRegisterFormValues | ManagerRegisterFormValues>({
    resolver: zodResolver(isDriver ? driverRegisterSchema : managerRegisterSchema),
  });

  const onSubmit = async (values: DriverRegisterFormValues | ManagerRegisterFormValues) => {
    setSubmitting(true);
    try {
      const response = isDriver
        ? await AuthService.registerDriver(values as DriverRegisterFormValues)
        : await AuthService.registerManager(values as ManagerRegisterFormValues);

      if (response.success) {
        push(response.message, 'success');
        navigate('/login');
      } else {
        push(response.message || 'Registration failed', 'error');
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>First Name</FieldLabel>
          <input className="input-field" {...register('firstName' as any)} />
        </div>
        <div>
          <FieldLabel required>Last Name</FieldLabel>
          <input className="input-field" {...register('lastName' as any)} />
        </div>
      </div>

      <div>
        <FieldLabel required>Email</FieldLabel>
        <input type="email" className="input-field" {...register('email' as any)} />
      </div>

      <div>
        <FieldLabel required>Password</FieldLabel>
        <PasswordInput {...register('password' as any)} />
      </div>

      <div>
        <FieldLabel required>Phone</FieldLabel>
        <input placeholder="+254712345678" className="input-field" {...register('phone' as any)} />
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

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : `Register as ${isDriver ? 'Driver' : 'Manager'}`}
      </button>
    </form>
  );
}
