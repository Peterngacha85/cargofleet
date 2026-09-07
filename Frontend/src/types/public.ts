export interface PublicTrackingInfo {
  tripNumber: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  dropoffAddress: string;
  driverFirstName?: string;
  location: { latitude: number; longitude: number; timestamp: string } | null;
}

export interface PublicRatingInfo {
  tripNumber: string;
  driverName?: string;
  tripStatus: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  alreadyRated: boolean;
}
