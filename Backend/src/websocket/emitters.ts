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

// Targeted at one driver (their socket joins a room named after their driverId on connect),
// unlike emitToDrivers() above which broadcasts to every connected driver.
export const emitToDriver = (driverId: string, event: string, payload: unknown) => {
  ioInstance?.of('/driver').to(driverId).emit(event, payload);
};

export const emitToAdmins = (event: string, payload: unknown) => {
  ioInstance?.of('/admin').emit(event, payload);
};
