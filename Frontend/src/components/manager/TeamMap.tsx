import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMap } from '@/hooks/useMap';
import MapComponent from '@/components/map/MapComponent';
import { DriverLocationUpdate } from '@/types/map';

export default function TeamMap() {
  const { user } = useAuth();
  const socketRef = useSocket('manager', { managerId: user?.id ?? '' }, !!user);
  const { driverLocations, upsertDriverLocation } = useMap();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (update: DriverLocationUpdate) => upsertDriverLocation(update);
    socket.on('driverLocationUpdate', handler);

    return () => {
      socket.off('driverLocationUpdate', handler);
    };
  }, [socketRef, upsertDriverLocation]);

  return (
    <div className="h-96 w-full">
      <MapComponent markers={Object.values(driverLocations)} />
    </div>
  );
}
