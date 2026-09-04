import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Avatar from './Avatar';

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
        <div className="flex items-center gap-3 text-sm">
          <Link to="/dashboard/profile" title="My Profile" className="transition hover:opacity-80">
            <Avatar
              role={user.role}
              photoUrl={user.profilePhoto}
              name={user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
            />
          </Link>
          <span className="capitalize text-gray-600">{user.role}</span>
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
