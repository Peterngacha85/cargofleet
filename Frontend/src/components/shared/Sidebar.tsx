import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { linksByRole, BadgeKey } from '@/config/navLinks';

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
    pendingApprovalsCount: pendingDriverCount + pendingManagerCount,
  };

  return (
    <nav className="hidden w-56 flex-shrink-0 bg-charcoal p-4 md:block">
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
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-lime text-charcoal' : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
