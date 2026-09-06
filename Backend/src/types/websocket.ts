export interface DriverLocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading?: number;
  tripId?: string;
  // When the point was captured on the device, not when the server received it - what makes
  // offline-buffered points (sent later, in a batch, once connectivity returns) land at their
  // correct place in the route instead of all bunching up at the reconnect time.
  timestamp?: string;
}

export interface TripStatusUpdatePayload {
  tripId: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
}

export interface DriverApprovalNotificationPayload {
  driverId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ManagerVerificationPayload {
  managerId: string;
  branchId?: string;
  action: 'verify' | 'reject';
}
