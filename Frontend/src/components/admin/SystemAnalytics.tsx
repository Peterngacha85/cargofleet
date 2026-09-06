import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import Select from '@/components/shared/Select';
import SearchInput from '@/components/shared/SearchInput';
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

interface BranchAnalytics extends Analytics {
  branchId: string;
  branchName: string;
}

const periodOptions = [
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
];

type SortField = 'branchName' | keyof Analytics;

const columns: { field: SortField; label: string }[] = [
  { field: 'branchName', label: 'Branch' },
  { field: 'totalTrips', label: 'Trips' },
  { field: 'completedTrips', label: 'Completed' },
  { field: 'completionRate', label: 'Completion' },
  { field: 'totalEarnings', label: 'Earnings' },
  { field: 'totalKilometers', label: 'Kilometers' },
  { field: 'averageRating', label: 'Rating' },
];

export default function SystemAnalytics() {
  const [branches, setBranches] = useState<BranchAnalytics[]>([]);
  const [systemTotals, setSystemTotals] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState('month');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'totalTrips',
    direction: 'desc',
  });

  useEffect(() => {
    // One batched request for every branch's numbers, instead of firing a separate
    // /analytics/branch/:id call per branch - matters once there are dozens of them.
    api.get('/analytics/system', { params: { period } }).then(({ data }) => {
      setBranches(data.data?.branches ?? []);
      setSystemTotals(data.data?.systemTotals ?? null);
    });
  }, [period]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = branches.filter((b) => !query || b.branchName.toLowerCase().includes(query));

    return [...filtered].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      if (sort.field === 'branchName') return a.branchName.localeCompare(b.branchName) * dir;
      return (a[sort.field] - b[sort.field]) * dir;
    });
  }, [branches, search, sort]);

  const handleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'desc' }
    );
  };

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

      <div className="flex flex-col gap-4">
        <div className="sticky top-0 z-10 bg-soft-gray pb-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-charcoal">By Branch</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <SearchInput className="min-w-[200px] flex-1" value={search} onChange={setSearch} placeholder="Search branches…" />
          </div>
        </div>

        {branches.length === 0 ? (
          <p className="text-sm text-gray-500">No branches yet.</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="No matching branches" description="Try a different search." />
        ) : (
          // Same plain-list structure as the Trips tab (no <table>, no nested scroll
          // container) - a nested overflow-auto box here was the one thing every failed
          // attempt at this had in common, so this drops it and lets the list grow with
          // the page like every other list in the app already does.
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 gap-2 border-b border-gray-200 bg-soft-gray px-4 py-3">
                {columns.map(({ field, label }) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => handleSort(field)}
                    className={clsx(
                      'flex items-center gap-1 whitespace-nowrap text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-charcoal',
                      field !== 'branchName' && 'justify-end'
                    )}
                  >
                    {label}
                    {sort.field === field ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                ))}
              </div>

              {rows.map((b) => (
                <div
                  key={b.branchId}
                  className="grid grid-cols-7 gap-2 border-b border-gray-100 px-4 py-3 text-sm hover:bg-soft-gray/50"
                >
                  <span className="font-medium text-charcoal">{b.branchName}</span>
                  <span className="text-right text-charcoal">{b.totalTrips}</span>
                  <span className="text-right text-charcoal">{b.completedTrips}</span>
                  <span className="text-right text-charcoal">{b.completionRate}%</span>
                  <span className="text-right text-charcoal">{formatCurrency(b.totalEarnings)}</span>
                  <span className="text-right text-charcoal">{b.totalKilometers}</span>
                  <span className="text-right text-charcoal">{b.averageRating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
