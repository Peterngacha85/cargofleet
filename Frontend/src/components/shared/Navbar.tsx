import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';

// Logout lives on My Profile instead of here - the navbar's top-right corner is the hardest
// spot to reach one-handed on mobile, and a stray tap there logged people out with no warning.
export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between border-b-2 border-lime bg-white px-6 shadow-sm">
      <img src="/images/logo.png" alt="CargoFleet" className="h-8 w-auto" />
      {user && (
        <Link to="/dashboard/profile" title="My Profile" className="flex items-center gap-3 text-sm transition hover:opacity-80">
          <Avatar
            role={user.role}
            photoUrl={user.profilePhoto}
            name={user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
          />
          <span className="capitalize text-gray-600">{user.role}</span>
        </Link>
      )}
    </header>
  );
}
