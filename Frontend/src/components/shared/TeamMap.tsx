import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMap } from '@/hooks/useMap';
import { useProfileStore } from '@/stores/profileStore';
import { useMapFocusStore } from '@/stores/mapFocusStore';
import { DriverService } from '@/services/driverService';
import { Driver, DriverUserSummary, PopulatedBranchSummary } from '@/types/driver';
import MapComponent, { MarkerColor } from '@/components/map/MapComponent';
import { DriverLocationUpdate } from '@/types/map';

export default function TeamMap() {
  const { user, role } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const myBranchId = profile?.manager?.assignedBranchId;

  const socketRef = useSocket(
    role === 'admin' ? 'admin' : 'manager',
    role === 'admin' ? { adminId: user?.id ?? '' } : { managerId: user?.id ?? '' },
    !!user
  );
  const { driverLocations, upsertDriverLocation } = useMap();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const focusRequest = useMapFocusStore((s) => s.focusRequest);

  useEffect(() => {
    DriverService.list({ status: 'active' }).then((res) => setDrivers(res.data?.drivers ?? []));
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (update: DriverLocationUpdate) => upsertDriverLocation(update);
    socket.on('driverLocationUpdate', handler);

    return () => {
      socket.off('driverLocationUpdate', handler);
    };
  }, [socketRef, upsertDriverLocation]);

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
    <div className="h-96 w-full">
      <MapComponent
        markers={Object.values(driverLocations)}
        labelFor={labelFor}
        markerColorFor={markerColorFor}
        focusRequest={focusRequest}
      />
    </div>
  );
}
