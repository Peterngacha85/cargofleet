import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

type Namespace = 'driver';

const sockets: Partial<Record<Namespace, Socket>> = {};

// Direct port of Frontend/src/services/socketService.ts's connectSocket - socket.io-client
// behaves the same under React Native as in a browser once the transport is forced to
// 'websocket' (no long-polling fallback, which RN's networking stack doesn't need anyway).
export const connectSocket = (namespace: Namespace, auth: Record<string, string>): Socket => {
  if (sockets[namespace]?.connected) {
    return sockets[namespace] as Socket;
  }

  const socket = io(`${SOCKET_URL}/${namespace}`, {
    auth,
    transports: ['websocket'],
  });

  sockets[namespace] = socket;
  return socket;
};

export const disconnectSocket = (namespace: Namespace) => {
  sockets[namespace]?.disconnect();
  delete sockets[namespace];
};

export const disconnectAllSockets = () => {
  (Object.keys(sockets) as Namespace[]).forEach(disconnectSocket);
};
