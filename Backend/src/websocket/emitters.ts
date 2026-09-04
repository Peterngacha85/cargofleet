import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setSocketServer = (io: Server) => {
  ioInstance = io;
};

export const emitToManagers = (event: string, payload: unknown) => {
  ioInstance?.of('/manager').emit(event, payload);
};

export const emitToDrivers = (event: string, payload: unknown) => {
  ioInstance?.of('/driver').emit(event, payload);
};

export const emitToAdmins = (event: string, payload: unknown) => {
  ioInstance?.of('/admin').emit(event, payload);
};
