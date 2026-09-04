import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-soft-gray text-center">
      <h1 className="text-4xl font-bold text-charcoal">404</h1>
      <p className="text-gray-500">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">
        Go home
      </Link>
    </div>
  );
}
