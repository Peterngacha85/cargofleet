import { useEffect, useState } from 'react';
import { Star, BarChart3 } from 'lucide-react';
import { api } from '@/services/api';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';
import AnalyticsStatsGrid from './AnalyticsStatsGrid';

interface TopDriver {
  name: string;
  trips: number;
  rating: number;
}

interface Analytics {
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
  totalEarnings: number;
  totalKilometers: number;
  averageRating: number;
  topDriver: TopDriver | null;
}

interface BranchAnalyticsProps {
  branchId: string;
}

const periodOptions = [
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
];

export default function BranchAnalytics({ branchId }: BranchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (!branchId) return;
    api
      .get(`/analytics/branch/${branchId}`, { params: { period } })
      .then(({ data }) => setAnalytics(data.data?.analytics ?? null))
      .catch(() => setAnalytics(null));
  }, [branchId, period]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Select className="w-40" value={period} onChange={setPeriod} options={periodOptions} />
      </div>

      {!analytics ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="No trips have been logged for this branch in this period."
        />
      ) : (
        <>
          <AnalyticsStatsGrid {...analytics} />
          {analytics.topDriver && (
            <div className="card flex items-center gap-3">
              <Star className="h-5 w-5 flex-shrink-0 text-lime" />
              <div>
                <p className="text-sm font-medium text-charcoal">Top Driver: {analytics.topDriver.name}</p>
                <p className="text-xs text-gray-500">
                  {analytics.topDriver.trips} trips · {analytics.topDriver.rating.toFixed(1)} avg rating
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
