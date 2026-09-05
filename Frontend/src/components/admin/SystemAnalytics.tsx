import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { DriverService } from '@/services/driverService';
import { api } from '@/services/api';
import { Branch } from '@/types/driver';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';
import AnalyticsStatsGrid from '@/components/manager/AnalyticsStatsGrid';

interface Analytics {
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
  totalEarnings: number;
  totalKilometers: number;
  averageRating: number;
}

const periodOptions = [
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
];

export default function SystemAnalytics() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [analyticsByBranch, setAnalyticsByBranch] = useState<Record<string, Analytics>>({});
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
  }, []);

  useEffect(() => {
    if (branches.length === 0) return;
    Promise.all(
      branches.map((b) =>
        api
          .get(`/analytics/branch/${b._id}`, { params: { period } })
          .then(({ data }) => [b._id, data.data?.analytics as Analytics | undefined] as const)
      )
    ).then((entries) => {
      const map: Record<string, Analytics> = {};
      entries.forEach(([id, a]) => {
        if (a) map[id] = a;
      });
      setAnalyticsByBranch(map);
    });
  }, [branches, period]);

  const allAnalytics = Object.values(analyticsByBranch);
  const totalTrips = allAnalytics.reduce((sum, a) => sum + a.totalTrips, 0);
  const completedTrips = allAnalytics.reduce((sum, a) => sum + a.completedTrips, 0);

  const systemTotals: Analytics | null = allAnalytics.length
    ? {
        totalTrips,
        completedTrips,
        completionRate: totalTrips ? Math.round((completedTrips / totalTrips) * 1000) / 10 : 0,
        totalEarnings: allAnalytics.reduce((sum, a) => sum + a.totalEarnings, 0),
        totalKilometers: allAnalytics.reduce((sum, a) => sum + a.totalKilometers, 0),
        averageRating:
          Math.round((allAnalytics.reduce((sum, a) => sum + a.averageRating, 0) / allAnalytics.length) * 10) / 10,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">System Totals</h2>
          <Select className="w-40" value={period} onChange={setPeriod} options={periodOptions} />
        </div>
        {systemTotals ? (
          <AnalyticsStatsGrid {...systemTotals} />
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No analytics yet"
            description="No branch has logged trips in this period."
          />
        )}
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="font-semibold text-charcoal">By Branch</h2>
        {branches.map((branch) => {
          const analytics = analyticsByBranch[branch._id];
          return (
            <div key={branch._id}>
              <h3 className="mb-2 text-sm font-medium text-gray-500">{branch.name}</h3>
              {analytics ? (
                <AnalyticsStatsGrid {...analytics} />
              ) : (
                <p className="text-sm text-gray-400">Loading…</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
