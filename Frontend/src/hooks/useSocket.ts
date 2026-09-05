import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket } from '@/services/socketService';

// Several components (TeamMap, DashboardPage, approval lists) call this for the same
// namespace at once, sharing one cached connection (see connectSocket). Deliberately does
// NOT disconnect on unmount - it used to, which meant switching away from whichever one of
// them happened to be mounted killed the connection for everyone else still using it. The
// connection's lifecycle is logout-driven instead (see authStore's disconnectAllSockets()).
export const useSocket = (
  namespace: 'driver' | 'manager' | 'admin',
  auth: Record<string, string>,
  enabled: boolean
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    socketRef.current = connectSocket(namespace, auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, enabled, JSON.stringify(auth)]);

  return socketRef;
};
