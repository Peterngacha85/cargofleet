import SuperAdminLoginForm from '@/components/auth/SuperAdminLoginForm';

export default function SuperAdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-gray px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <img src="/images/logo.png" alt="CargoFleet" className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="mb-1 text-2xl font-bold text-charcoal">Super Admin</h1>
        <p className="mb-6 text-sm text-gray-500">Restricted access</p>

        <SuperAdminLoginForm />
      </div>
    </div>
  );
}
