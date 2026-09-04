export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface TripStatusChangedEvent {
  tripId: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
}
