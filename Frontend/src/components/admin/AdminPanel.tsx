import { useState } from 'react';
import clsx from 'clsx';
import BranchManagement from './BranchManagement';
import DriverDirectory from '@/components/shared/DriverDirectory';
import TeamMap from '@/components/shared/TeamMap';
import ManagerDirectory from './ManagerDirectory';
import UserManagement from './UserManagement';
import SystemAnalytics from './SystemAnalytics';

const tabs = [
  { key: 'branches', label: 'Branches', Component: BranchManagement },
  { key: 'map', label: 'Live Map', Component: TeamMap },
  { key: 'drivers', label: 'Drivers', Component: DriverDirectory },
  { key: 'managers', label: 'Managers', Component: ManagerDirectory },
  { key: 'pending', label: 'Pending Approvals', Component: UserManagement },
  { key: 'analytics', label: 'System Analytics', Component: SystemAnalytics },
] as const;

export default function AdminPanel() {
  const [active, setActive] = useState<(typeof tabs)[number]['key']>('branches');
  const ActiveComponent = tabs.find((t) => t.key === active)?.Component ?? BranchManagement;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={clsx(
              'whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2',
              active === tab.key ? 'border-lime text-charcoal' : 'border-transparent text-gray-500'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  );
}
