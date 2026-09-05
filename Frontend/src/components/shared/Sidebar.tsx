import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Users, UsersRound, Truck, Building2, UserCircle, Route, Package, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApprovalsStore } from '@/stores/approvalsStore';

type BadgeKey = 'pendingDriverCount' | 'pendingManagerCount' | 'pendingVehicleCount' | 'scheduledTripCount';

interface SidebarLink {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: BadgeKey;
}

const linksByRole: Record<string, SidebarLink[]> = {
  driver: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/map', label: 'My Map', icon: Map },
    { to: '/dashboard/trips', label: 'My Trips', icon: Package, badgeKey: 'scheduledTripCount' },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/map', label: 'Map', icon: Map },
    { to: '/dashboard/drivers', label: 'Pending Drivers', icon: Users, badgeKey: 'pendingDriverCount' },
    { to: '/dashboard/my-drivers', label: 'My Drivers', icon: UsersRound },
    { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
    { to: '/dashboard/trips', label: 'Trips', icon: Route },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
    { to: '/dashboard/managers', label: 'Managers', icon: Users, badgeKey: 'pendingManagerCount' },
    { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck, badgeKey: 'pendingVehicleCount' },
    { to: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  ],
};

export default function Sidebar() {
  const { role } = useAuth();
  const pendingDriverCount = useApprovalsStore((s) => s.pendingDriverCount);
  const pendingManagerCount = useApprovalsStore((s) => s.pendingManagerCount);
  const pendingVehicleCount = useApprovalsStore((s) => s.pendingVehicleCount);
  const scheduledTripCount = useApprovalsStore((s) => s.scheduledTripCount);
  const links = (role && linksByRole[role]) || [];

  const badgeCounts: Record<BadgeKey, number> = {
    pendingDriverCount,
    pendingManagerCount,
    pendingVehicleCount,
    scheduledTripCount,
  };

  return (
    <nav className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white p-4 md:block">
      <ul className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, badgeKey }) => {
          const count = badgeKey ? badgeCounts[badgeKey] : 0;
          return (
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
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {count}
                  </span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
