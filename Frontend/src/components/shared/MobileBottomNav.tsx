import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { linksByRole, BadgeKey } from '@/config/navLinks';

// Sidebar is desktop-only (hidden below md) - without this, mobile users had no way to
// navigate at all beyond whatever one shortcut button happened to be on the current page.
export default function MobileBottomNav() {
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
    <nav className="fixed inset-x-0 bottom-0 z-[9999] flex overflow-x-auto border-t border-gray-200 bg-white md:hidden">
      {links.map(({ to, label, icon: Icon, badgeKey }) => {
        const count = badgeKey ? badgeCounts[badgeKey] : 0;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                // flex-1 spreads tabs evenly when there are few (e.g. driver's 4); min-w-0
                // lets each still shrink below its label's width without overflowing, since
                // the label wraps onto two lines instead of forcing a single nowrap line.
                'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                isActive ? 'text-charcoal' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon className={clsx('h-5 w-5', isActive && 'text-lime')} strokeWidth={isActive ? 2.5 : 2} />
                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {count}
                    </span>
                  )}
                </span>
                <span className="text-center leading-tight">{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
