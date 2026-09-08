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
  const pendingDriverDeletionCount = useApprovalsStore((s) => s.pendingDriverDeletionCount);
  const scheduledTripCount = useApprovalsStore((s) => s.scheduledTripCount);
  const activePhotoCount = useApprovalsStore((s) => s.activePhotoCount);
  const links = (role && linksByRole[role]) || [];

  const badgeCounts: Record<BadgeKey, number> = {
    pendingDriverCount,
    pendingManagerCount,
    pendingVehicleCount,
    scheduledTripCount,
    activePhotoCount,
    pendingApprovalsCount: pendingDriverCount + pendingManagerCount + pendingDriverDeletionCount,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[9999] flex overflow-x-auto bg-charcoal md:hidden">
      {links.map(({ to, label, icon: Icon, badgeKey }) => {
        const count = badgeKey ? badgeCounts[badgeKey] : 0;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                // flex-1 spreads tabs evenly when they all fit (e.g. driver's 4); the min-w
                // floor stops them shrinking past a readable size when there are many (e.g.
                // admin's 10), at which point the row overflows and the nav's own
                // overflow-x-auto kicks in a horizontal scroll instead of squeezing/overlapping.
                'relative flex min-w-16 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                isActive ? 'text-white' : 'text-gray-400'
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
