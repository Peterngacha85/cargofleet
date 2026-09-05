import { useEffect, useState } from 'react';
import clsx from 'clsx';
import BranchManagement from './BranchManagement';
import DriverDirectory from '@/components/shared/DriverDirectory';
import TeamMap from '@/components/shared/TeamMap';
import ManagerDirectory from './ManagerDirectory';
import UserManagement from './UserManagement';
import SystemAnalytics from './SystemAnalytics';
import AllTripsList from './AllTripsList';
import { useMapFocusStore } from '@/stores/mapFocusStore';

const tabs = [
  { key: 'map', label: 'Live Map', Component: TeamMap },
  { key: 'branches', label: 'Branches', Component: BranchManagement },
  { key: 'trips', label: 'Trips', Component: AllTripsList },
  { key: 'drivers', label: 'Drivers', Component: DriverDirectory },
  { key: 'managers', label: 'Managers', Component: ManagerDirectory },
  { key: 'pending', label: 'Pending Approvals', Component: UserManagement },
  { key: 'analytics', label: 'System Analytics', Component: SystemAnalytics },
] as const;

type TabKey = (typeof tabs)[number]['key'];

// Tabs live outside the URL, so without this a refresh always bounced the admin back to
// whatever the default tab is instead of leaving them where they were.
const ACTIVE_TAB_STORAGE_KEY = 'cargofleet.adminActiveTab';

function getStoredTab(): TabKey {
  const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return tabs.some((t) => t.key === stored) ? (stored as TabKey) : 'map';
}

export default function AdminPanel() {
  const [active, setActive] = useState<TabKey>(getStoredTab);
  const ActiveComponent = tabs.find((t) => t.key === active)?.Component ?? TeamMap;
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, active);
  }, [active]);

  // "Show on Map" from the Trips tab sets a focus request - jump to the Live Map tab so
  // the fly-to animation is actually visible, since Live Map isn't its own route here.
  useEffect(() => {
    if (focusRequest) setActive('map');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

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
      {active === 'map' ? <TeamMap fullHeight /> : <ActiveComponent />}
    </div>
  );
}
