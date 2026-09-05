import { Route, CheckCircle2, TrendingUp, Wallet, MapPinned, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface AnalyticsStatsGridProps {
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
  totalEarnings: number;
  totalKilometers: number;
  averageRating: number;
}

export default function AnalyticsStatsGrid({
  totalTrips,
  completedTrips,
  completionRate,
  totalEarnings,
  totalKilometers,
  averageRating,
}: AnalyticsStatsGridProps) {
  const stats = [
    { label: 'Total Trips', value: totalTrips, icon: Route },
    { label: 'Completed', value: completedTrips, icon: CheckCircle2 },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp },
    { label: 'Earnings', value: formatCurrency(totalEarnings), icon: Wallet },
    { label: 'Kilometers', value: totalKilometers, icon: MapPinned },
    { label: 'Avg Rating', value: averageRating.toFixed(1), icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card flex flex-col items-center gap-1 text-center">
          <Icon className="h-5 w-5 text-lime" />
          <p className="text-lg font-semibold text-charcoal">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
