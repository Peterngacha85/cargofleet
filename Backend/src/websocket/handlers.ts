import { Namespace, Socket } from 'socket.io';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Manager from '../models/Manager';
import { recordDriverLocation } from '../services/locationService';
import { DriverLocationPayload, TripStatusUpdatePayload } from '../types/websocket';
import { emitToManagers, emitToDrivers, emitToAdmins, emitToDriver } from './emitters';
import { logger } from '../utils/logger';

// Shared by both the manager and admin namespaces - a manager/admin sees a stale "in transit"
// trip with no marker (driver stopped sharing) and asks that driver to resume, without either
// side needing to know the other's socket namespace directly.
const handleRequestLocationSharing =
  (requestedByRole: 'manager' | 'admin') =>
  async (
    data: { driverId: string; tripId: string },
    ack?: (response: { success: boolean; message: string }) => void
  ) => {
    try {
      const trip = await Trip.findById(data.tripId).select('tripNumber driverId status');
      if (!trip || trip.driverId.toString() !== data.driverId) {
        ack?.({ success: false, message: 'Trip not found' });
        return;
      }
      if (trip.status !== 'in_transit') {
        ack?.({ success: false, message: `This trip is ${trip.status}, not in transit` });
        return;
      }

      emitToDriver(data.driverId, 'locationSharingRequested', {
        tripId: data.tripId,
        tripNumber: trip.tripNumber,
        requestedByRole,
      });
      ack?.({ success: true, message: 'Request sent to driver' });
    } catch (error) {
      logger.error('requestLocationSharing handler error', { error });
      ack?.({ success: false, message: 'Failed to send request' });
    }
  };

export const registerDriverNamespaceHandlers = (namespace: Namespace) => {
  namespace.on('connection', (socket: Socket) => {
    const driverId = socket.handshake.auth.driverId as string | undefined;
    logger.info(`Driver connected to /driver namespace`, { driverId, socketId: socket.id });

    // Lets emitToDriver() target this one driver instead of broadcasting to everyone connected.
    if (driverId) {
      socket.join(driverId);
    }

    socket.on('sendLocation', async (data: DriverLocationPayload) => {
      if (!driverId) return;

      try {
        await recordDriverLocation(driverId, data);

        let tripInfo: { tripNumber?: string; dropoffAddress?: string; tripStatus?: string } = {};
        if (data.tripId) {
          const trip = await Trip.findById(data.tripId).select('tripNumber dropoffLocation.address status');
          if (trip) {
            tripInfo = {
              tripNumber: trip.tripNumber,
              dropoffAddress: trip.dropoffLocation?.address,
              tripStatus: trip.status,
            };
          }
        }

        const locationUpdate = {
          driverId,
          tripId: data.tripId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: new Date(),
          ...tripInfo,
        };

        emitToManagers('driverLocationUpdate', locationUpdate);
        emitToAdmins('driverLocationUpdate', locationUpdate);
      } catch (error) {
        logger.error('sendLocation handler error', { error });
      }
    });

    // Lets other clients drop this driver's marker immediately instead of it sitting frozen
    // at its last known position until whoever's watching happens to refresh.
    socket.on('stopSharing', () => {
      if (!driverId) return;
      emitToManagers('driverStoppedSharing', { driverId });
      emitToAdmins('driverStoppedSharing', { driverId });
    });

    socket.on(
      'updateTripStatus',
      async (data: TripStatusUpdatePayload, ack?: (response: { success: boolean; message: string }) => void) => {
        if (!driverId) {
          ack?.({ success: false, message: 'Not authenticated' });
          return;
        }

        try {
          // A driver may only start their own trip this way. Completing a trip stays gated to
          // the destination branch manager via the REST endpoint (see tripController) - letting
          // a driver self-complete here would bypass that "goods received" confirmation.
          if (data.status !== 'in_transit') {
            logger.warn('Rejected driver-initiated trip status change', { driverId, status: data.status });
            ack?.({ success: false, message: 'Unsupported status change' });
            return;
          }

          const trip = await Trip.findById(data.tripId);
          if (!trip || trip.driverId.toString() !== driverId) {
            logger.warn('Rejected trip status update for a trip that is not this driver\'s', {
              driverId,
              tripId: data.tripId,
            });
            ack?.({ success: false, message: 'Trip not found' });
            return;
          }

          if (trip.status !== 'scheduled') {
            ack?.({ success: false, message: `This trip is already ${trip.status}` });
            return;
          }

          // A driver can only be actively tracked on one trip at a time - otherwise location
          // updates would silently stop reaching whichever trip isn't the most recently started,
          // leaving it stuck "in transit" forever with nobody sending it updates.
          const existingActiveTrip = await Trip.findOne({ driverId, status: 'in_transit' });
          if (existingActiveTrip) {
            ack?.({
              success: false,
              message: `You already have an active trip (${existingActiveTrip.tripNumber}). Complete it before starting another.`,
            });
            return;
          }

          trip.status = 'in_transit';
          trip.tripStartTime = new Date();
          await trip.save();

          emitToManagers('tripStatusChanged', { tripId: data.tripId, status: 'in_transit' });
          emitToAdmins('tripStatusChanged', { tripId: data.tripId, status: 'in_transit' });

          ack?.({ success: true, message: 'Trip started' });
        } catch (error) {
          logger.error('updateTripStatus handler error', { error });
          ack?.({ success: false, message: 'Failed to start trip' });
        }
      }
    );

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

    socket.on('requestLocationSharing', handleRequestLocationSharing('manager'));

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

    socket.on('requestLocationSharing', handleRequestLocationSharing('admin'));

    socket.on('disconnect', () => {
      logger.info('Admin disconnected');
    });
  });
};
