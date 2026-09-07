import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMap } from '@/hooks/useMap';
import { useProfileStore } from '@/stores/profileStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { DriverService } from '@/services/driverService';
import { TripService } from '@/services/tripService';
import { LocationService } from '@/services/locationService';
import { Driver, DriverUserSummary, PopulatedBranchSummary } from '@/types/driver';
import MapComponent, { MarkerColor } from '@/components/map/MapComponent';

interface TeamMapProps {
  // Admin's Live Map tab wants to fill the remaining page height; embedded elsewhere
  // (e.g. ManagerDashboard, stacked above other cards) it keeps its original fixed height.
  fullHeight?: boolean;
}

const idOf = (value?: string | { _id: string }) => (typeof value === 'string' ? value : value?._id);

export default function TeamMap({ fullHeight }: TeamMapProps) {
  const { role } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const myBranchId = profile?.manager?.assignedBranchId;

  // Live location updates are tracked centrally in DashboardPage (into mapStore) so they keep
  // flowing no matter which sub-page/tab is mounted - this just reads that shared state.
  const { driverLocations, upsertDriverLocation } = useMap();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  // driverId -> true when that driver's current trip is heading to this manager's own branch
  // from somewhere else - drives the "incoming" marker color.
  const [incomingDriverIds, setIncomingDriverIds] = useState<Set<string>>(new Set());
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  useEffect(() => {
    DriverService.list({ status: 'active' }).then((res) => setDrivers(res.data?.drivers ?? []));
  }, []);

  useEffect(() => {
    if (role !== 'manager' || !myBranchId) return;

    TripService.list({ visibleToBranchId: myBranchId, status: 'in_transit' }).then((res) => {
      const trips = res.data?.trips ?? [];

      const incoming = new Set<string>();
      trips.forEach((t) => {
        const originId = idOf(t.branchId);
        const destinationId = idOf(t.destinationBranchId);
        const driverId = idOf(t.driverId);
        if (driverId && destinationId === myBranchId && originId !== myBranchId) {
          incoming.add(driverId);
        }
      });
      setIncomingDriverIds(incoming);

      // Catch-up read: a live driverLocationUpdate broadcast only reaches a socket that's
      // connected at the moment it's sent, so a manager who just opened this map (or whose
      // connection briefly dropped) would otherwise see no marker at all for a driver who's
      // actually in transit, or a stale one with no trip attached.
      trips.forEach((t) => {
        const driverId = idOf(t.driverId);
        if (!driverId) return;
        LocationService.getDriverLatest(driverId).then((locRes) => {
          const location = locRes.data?.location;
          if (location) upsertDriverLocation(location);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, myBranchId]);

  const labelFor = (driverId: string) => {
    const driver = drivers.find((d) => d._id === driverId);
    const u = driver?.userId as DriverUserSummary | undefined;
    return u ? `${u.firstName} ${u.lastName}` : driverId;
  };

  // Admin has no "home branch" - every driver counts as theirs. A manager sees their own
  // branch's drivers as green, a driver from elsewhere currently heading to this branch as
  // blue ("incoming"), and everyone else in red so cross-branch outbound trips stay visible
  // without reading as relevant to act on.
  const markerColorFor = (driverId: string): MarkerColor => {
    if (role === 'admin') return 'green';

    const driver = drivers.find((d) => d._id === driverId);
    const branch = driver?.branchId as PopulatedBranchSummary | string | undefined;
    const driverBranchId = typeof branch === 'string' ? branch : branch?._id;

    if (driverBranchId && driverBranchId === myBranchId) return 'green';
    if (incomingDriverIds.has(driverId)) return 'blue';
    return 'red';
  };

  return (
    <div className="flex flex-col gap-2">
      {role === 'manager' && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-lime" /> Your branch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Incoming to your branch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Other
          </span>
        </div>
      )}
      <div className={fullHeight ? 'h-[calc(100vh-210px)] w-full' : 'h-96 w-full'}>
        <MapComponent
          markers={Object.values(driverLocations)}
          labelFor={labelFor}
          markerColorFor={markerColorFor}
          focusRequest={focusRequest}
        />
      </div>
    </div>
  );
}
