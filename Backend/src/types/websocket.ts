export interface DriverLocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading?: number;
  tripId?: string;
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
