import { useParams, Link, Navigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function RegisterPage() {
  const { role } = useParams<{ role: string }>();

  if (role !== 'driver' && role !== 'manager') {
    return <Navigate to="/register/driver" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-gray px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <img src="/images/logo.png" alt="CargoFleet" className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="mb-1 text-2xl font-bold capitalize text-charcoal">Register as {role}</h1>
        <p className="mb-6 text-sm text-gray-500">
          {role === 'driver'
            ? 'Your account will need branch manager approval before you can log in.'
            : 'Your account will need super admin verification before you can log in.'}
        </p>

        <RegisterForm role={role} />

        <div className="my-4 flex items-center gap-2 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          OR
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleAuthButton role={role} />

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-charcoal underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
