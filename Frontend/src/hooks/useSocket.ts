import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/services/socketService';

export const useSocket = (
  namespace: 'driver' | 'manager' | 'admin',
  auth: Record<string, string>,
  enabled: boolean
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = connectSocket(namespace, auth);
    socketRef.current = socket;

    return () => {
      disconnectSocket(namespace);
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, enabled, JSON.stringify(auth)]);

  return socketRef;
};
