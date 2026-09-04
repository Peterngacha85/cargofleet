import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-gray px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <img src="/images/logo.png" alt="CargoFleet" className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="mb-1 text-2xl font-bold text-charcoal">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to CargoFleet</p>

        <LoginForm />

        <div className="my-4 flex items-center gap-2 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          OR
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* role only matters for a first-time Google sign-up; an existing account keeps its real role */}
        <GoogleAuthButton role="driver" />

        <p className="mt-6 text-center text-sm text-gray-500">
          New here?{' '}
          <Link to="/register/driver" className="font-medium text-charcoal underline">
            Register as Driver
          </Link>{' '}
          or{' '}
          <Link to="/register/manager" className="font-medium text-charcoal underline">
            Manager
          </Link>
        </p>
      </div>
    </div>
  );
}
