import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, LoginFormValues } from '@/utils/validators';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import PasswordInput from '@/components/shared/PasswordInput';

export default function LoginForm() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { setSession } = useAuth();
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const response = isSuperAdmin
        ? await AuthService.superAdminLogin(values.email, values.password, secretCode)
        : await AuthService.login(values.email, values.password);

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
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" className="input-field" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <PasswordInput id="password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {isSuperAdmin && (
        <div>
          <label className="label" htmlFor="secretCode">
            4-Digit Secret Code
          </label>
          <PasswordInput
            id="secretCode"
            inputMode="numeric"
            maxLength={4}
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
          />
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>

      <button
        type="button"
        onClick={() => setIsSuperAdmin((v) => !v)}
        className="text-sm text-gray-500 underline"
      >
        {isSuperAdmin ? 'Sign in as Driver/Manager instead' : 'Sign in as Super Admin'}
      </button>
    </form>
  );
}
