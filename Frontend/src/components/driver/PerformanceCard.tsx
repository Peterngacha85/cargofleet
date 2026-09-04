import { Star, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PerformanceCardProps {
  avgRating: number;
  totalTrips: number;
  completedTrips: number;
  totalEarnings: number;
}

export default function PerformanceCard({ avgRating, totalTrips, completedTrips, totalEarnings }: PerformanceCardProps) {
  return (
    <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="flex flex-col items-center gap-1">
        <Star className="h-5 w-5 text-lime" />
        <span className="text-lg font-semibold text-charcoal">{avgRating.toFixed(1)}</span>
        <span className="text-xs text-gray-500">Avg Rating</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <TrendingUp className="h-5 w-5 text-lime" />
        <span className="text-lg font-semibold text-charcoal">{completedTrips}</span>
        <span className="text-xs text-gray-500">Completed</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold text-charcoal">{totalTrips}</span>
        <span className="text-xs text-gray-500">Total Trips</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold text-charcoal">{formatCurrency(totalEarnings)}</span>
        <span className="text-xs text-gray-500">Earnings</span>
      </div>
    </div>
  );
}
