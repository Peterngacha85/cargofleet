import { io, Socket } from 'socket.io-client';

type Namespace = 'driver' | 'manager' | 'admin';

const sockets: Partial<Record<Namespace, Socket>> = {};

export const connectSocket = (namespace: Namespace, auth: Record<string, string>): Socket => {
  if (sockets[namespace]?.connected) {
    return sockets[namespace] as Socket;
  }

  const socket = io(`${import.meta.env.VITE_SOCKET_URL}/${namespace}`, {
    auth,
    transports: ['websocket'],
  });

  sockets[namespace] = socket;
  return socket;
};

// Used from the manager/admin Trips views to nudge a driver whose in-transit trip has no
// marker on the map (they stopped sharing) - relies on the backend's ack callback so the
// caller can show a "request sent" vs. "failed" toast instead of firing blind.
export const requestLocationSharing = (
  namespace: 'manager' | 'admin',
  auth: Record<string, string>,
  driverId: string,
  tripId: string
): Promise<{ success: boolean; message: string }> => {
  const socket = connectSocket(namespace, auth);
  return new Promise((resolve) => {
    socket.emit('requestLocationSharing', { driverId, tripId }, resolve);
  });
};

export const disconnectSocket = (namespace: Namespace) => {
  sockets[namespace]?.disconnect();
  delete sockets[namespace];
};

export const disconnectAllSockets = () => {
  (Object.keys(sockets) as Namespace[]).forEach(disconnectSocket);
};
