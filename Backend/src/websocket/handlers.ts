import { Namespace, Socket } from 'socket.io';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Manager from '../models/Manager';
import { recordDriverLocation } from '../services/locationService';
import { DriverLocationPayload, TripStatusUpdatePayload } from '../types/websocket';
import { emitToManagers, emitToDrivers } from './emitters';
import { logger } from '../utils/logger';

export const registerDriverNamespaceHandlers = (namespace: Namespace) => {
  namespace.on('connection', (socket: Socket) => {
    const driverId = socket.handshake.auth.driverId as string | undefined;
    logger.info(`Driver connected to /driver namespace`, { driverId, socketId: socket.id });

    socket.on('sendLocation', async (data: DriverLocationPayload) => {
      if (!driverId) return;

      try {
        await recordDriverLocation(driverId, data);

        emitToManagers('driverLocationUpdate', {
          driverId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('sendLocation handler error', { error });
      }
    });

    socket.on('updateTripStatus', async (data: TripStatusUpdatePayload) => {
      try {
        await Trip.findByIdAndUpdate(data.tripId, { status: data.status });
        emitToManagers('tripStatusChanged', { tripId: data.tripId, status: data.status });
      } catch (error) {
        logger.error('updateTripStatus handler error', { error });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Driver ${driverId ?? 'unknown'} disconnected`);
    });
  });
};

export const registerManagerNamespaceHandlers = (namespace: Namespace) => {
  namespace.on('connection', (socket: Socket) => {
    const managerId = socket.handshake.auth.managerId as string | undefined;
    logger.info(`Manager connected to /manager namespace`, { managerId, socketId: socket.id });

    socket.on(
      'driverApprovalNotification',
      async (data: { driverId: string; action: 'approve' | 'reject'; reason?: string }) => {
        try {
          if (data.action === 'approve') {
            await Driver.findByIdAndUpdate(data.driverId, { status: 'active' });
            emitToDrivers('approvalNotification', { message: 'Your account has been approved!' });
          } else {
            await Driver.findByIdAndUpdate(data.driverId, {
              status: 'rejected',
              rejectionReason: data.reason,
            });
            emitToDrivers('approvalNotification', {
              message: 'Your account registration was rejected.',
              reason: data.reason,
            });
          }
        } catch (error) {
          logger.error('driverApprovalNotification handler error', { error });
        }
      }
    );

    socket.on('disconnect', () => {
      logger.info(`Manager ${managerId ?? 'unknown'} disconnected`);
    });
  });
};

export const registerAdminNamespaceHandlers = (namespace: Namespace) => {
  namespace.on('connection', (socket: Socket) => {
    logger.info('Admin connected to /admin namespace', { socketId: socket.id });

    socket.on(
      'managerVerification',
      async (data: { managerId: string; branchId?: string; action: 'verify' | 'reject' }) => {
        try {
          if (data.action === 'verify' && data.branchId) {
            await Manager.findByIdAndUpdate(data.managerId, {
              status: 'active',
              assignedBranchId: data.branchId,
            });
          } else {
            await Manager.findByIdAndUpdate(data.managerId, { status: 'rejected' });
          }
        } catch (error) {
          logger.error('managerVerification handler error', { error });
        }
      }
    );

    socket.on('disconnect', () => {
      logger.info('Admin disconnected');
    });
  });
};
