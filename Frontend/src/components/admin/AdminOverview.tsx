import { Link } from 'react-router-dom';
import { ClipboardCheck, Truck, Route, UsersRound } from 'lucide-react';
import { useApprovalsStore } from '@/stores/approvalsStore';
import TeamMap from '@/components/shared/TeamMap';

export default function AdminOverview() {
  const pendingDriverCount = useApprovalsStore((s) => s.pendingDriverCount);
  const pendingManagerCount = useApprovalsStore((s) => s.pendingManagerCount);
  const pendingVehicleCount = useApprovalsStore((s) => s.pendingVehicleCount);
  const scheduledTripCount = useApprovalsStore((s) => s.scheduledTripCount);

  const stats = [
    { label: 'Pending Approvals', value: pendingDriverCount + pendingManagerCount, icon: ClipboardCheck, to: '/dashboard/pending' },
    { label: 'Pending Vehicles', value: pendingVehicleCount, icon: Truck, to: '/dashboard/vehicles' },
    { label: 'Scheduled Trips', value: scheduledTripCount, icon: Route, to: '/dashboard/trips' },
    { label: 'Pending Managers', value: pendingManagerCount, icon: UsersRound, to: '/dashboard/pending' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="card flex flex-col items-center gap-1 hover:border-lime">
            <Icon className="h-5 w-5 text-lime" />
            <span className="text-lg font-semibold text-charcoal">{value}</span>
            <span className="text-center text-xs text-gray-500">{label}</span>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Live Map</h2>
        <TeamMap />
      </div>
    </div>
  );
}
