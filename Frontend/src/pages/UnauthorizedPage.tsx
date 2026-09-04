import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-soft-gray text-center">
      <h1 className="text-2xl font-bold text-charcoal">Access Denied</h1>
      <p className="text-gray-500">You don't have permission to view this page.</p>
      <Link to="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
