import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useProfileStore } from '@/stores/profileStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { DriverService } from '@/services/driverService';
import { Driver, DriverUserSummary, PopulatedBranchSummary } from '@/types/driver';
import MapComponent, { MarkerColor } from '@/components/map/MapComponent';

interface TeamMapProps {
  // Admin's Live Map tab wants to fill the remaining page height; embedded elsewhere
  // (e.g. ManagerDashboard, stacked above other cards) it keeps its original fixed height.
  fullHeight?: boolean;
}

export default function TeamMap({ fullHeight }: TeamMapProps) {
  const { role } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const myBranchId = profile?.manager?.assignedBranchId;

  // Live location updates are tracked centrally in DashboardPage (into mapStore) so they keep
  // flowing no matter which sub-page/tab is mounted - this just reads that shared state.
  const { driverLocations } = useMap();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  useEffect(() => {
    DriverService.list({ status: 'active' }).then((res) => setDrivers(res.data?.drivers ?? []));
  }, []);

  const labelFor = (driverId: string) => {
    const driver = drivers.find((d) => d._id === driverId);
    const u = driver?.userId as DriverUserSummary | undefined;
    return u ? `${u.firstName} ${u.lastName}` : driverId;
  };

  // Admin has no "home branch" - every driver counts as theirs. A manager only sees their
  // own branch's drivers as green; everyone else still shows up (so cross-branch inbound/
  // outbound trips stay visible) but in red to make ownership obvious at a glance.
  const markerColorFor = (driverId: string): MarkerColor => {
    if (role === 'admin') return 'green';

    const driver = drivers.find((d) => d._id === driverId);
    const branch = driver?.branchId as PopulatedBranchSummary | string | undefined;
    const driverBranchId = typeof branch === 'string' ? branch : branch?._id;

    return driverBranchId && driverBranchId === myBranchId ? 'green' : 'red';
  };

  return (
    <div className={fullHeight ? 'h-[calc(100vh-180px)] w-full' : 'h-96 w-full'}>
      <MapComponent
        markers={Object.values(driverLocations)}
        labelFor={labelFor}
        markerColorFor={markerColorFor}
        focusRequest={focusRequest}
      />
    </div>
  );
}
