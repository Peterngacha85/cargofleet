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

export const disconnectSocket = (namespace: Namespace) => {
  sockets[namespace]?.disconnect();
  delete sockets[namespace];
};

export const disconnectAllSockets = () => {
  (Object.keys(sockets) as Namespace[]).forEach(disconnectSocket);
};
