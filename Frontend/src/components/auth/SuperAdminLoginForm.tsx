import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import PasswordInput from '@/components/shared/PasswordInput';
import FieldLabel from '@/components/shared/FieldLabel';

const superAdminLoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  secretCode: z.string().length(4, 'Secret code must be 4 digits'),
});

type SuperAdminLoginValues = z.infer<typeof superAdminLoginSchema>;

export default function SuperAdminLoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAuth();
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuperAdminLoginValues>({ resolver: zodResolver(superAdminLoginSchema) });

  const onSubmit = async (values: SuperAdminLoginValues) => {
    setSubmitting(true);
    try {
      const response = await AuthService.superAdminLogin(values.email, values.password, values.secretCode);

      if (response.success && response.data) {
        setSession(response.data.accessToken, response.data.refreshToken, response.data.user);
        navigate('/dashboard');
      } else {
        push(response.message || 'Login failed', 'error');
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="email" required>
          Email
        </FieldLabel>
        <input id="email" type="email" className="input-field" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="password" required>
          Password
        </FieldLabel>
        <PasswordInput id="password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="secretCode" required>
          4-Digit Secret Code
        </FieldLabel>
        <PasswordInput id="secretCode" inputMode="numeric" maxLength={4} {...register('secretCode')} />
        {errors.secretCode && <p className="mt-1 text-sm text-red-600">{errors.secretCode.message}</p>}
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
