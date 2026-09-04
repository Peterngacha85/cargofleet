import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

interface Analytics {
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
  totalEarnings: number;
  totalKilometers: number;
  averageRating: number;
}

interface BranchAnalyticsProps {
  branchId: string;
}

export default function BranchAnalytics({ branchId }: BranchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!branchId) return;
    api
      .get(`/analytics/branch/${branchId}`, { params: { period: 'month' } })
      .then(({ data }) => setAnalytics(data.data?.analytics ?? null))
      .catch(() => setAnalytics(null));
  }, [branchId]);

  if (!analytics) {
    return <p className="text-sm text-gray-500">No analytics available yet for this branch.</p>;
  }

  const stats = [
    { label: 'Total Trips', value: analytics.totalTrips },
    { label: 'Completed', value: analytics.completedTrips },
    { label: 'Completion Rate', value: `${analytics.completionRate}%` },
    { label: 'Earnings', value: formatCurrency(analytics.totalEarnings) },
    { label: 'Kilometers', value: analytics.totalKilometers },
    { label: 'Avg Rating', value: analytics.averageRating.toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="card text-center">
          <p className="text-lg font-semibold text-charcoal">{s.value}</p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
