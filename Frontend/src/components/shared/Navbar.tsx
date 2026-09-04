import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <img src="/images/logo.png" alt="CargoFleet" className="h-8 w-auto" />
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {user.firstName ?? user.email} · <span className="capitalize">{user.role}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-charcoal hover:text-red-600"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
