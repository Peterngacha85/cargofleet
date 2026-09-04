import { Server } from 'socket.io';
import {
  registerDriverNamespaceHandlers,
  registerManagerNamespaceHandlers,
  registerAdminNamespaceHandlers,
} from './handlers';
import { setSocketServer } from './emitters';

export const initializeWebSocket = (io: Server) => {
  setSocketServer(io);

  registerDriverNamespaceHandlers(io.of('/driver'));
  registerManagerNamespaceHandlers(io.of('/manager'));
  registerAdminNamespaceHandlers(io.of('/admin'));
};
