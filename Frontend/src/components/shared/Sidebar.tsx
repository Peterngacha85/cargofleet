import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Users, Truck, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const linksByRole: Record<string, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  driver: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/drivers', label: 'Drivers', icon: Users },
    { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
    { to: '/dashboard/managers', label: 'Managers', icon: Users },
  ],
};

export default function Sidebar() {
  const { role } = useAuth();
  const links = (role && linksByRole[role]) || [];

  return (
    <nav className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white p-4 md:block">
      <ul className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-lime text-charcoal' : 'text-gray-600 hover:bg-soft-gray'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
