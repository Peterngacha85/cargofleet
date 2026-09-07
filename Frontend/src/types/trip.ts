import { Delivery } from './delivery';

export type TripStatus = 'scheduled' | 'in_transit' | 'completed' | 'cancelled';

export interface TripLocation {
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
}

export interface PopulatedTripDriver {
  _id: string;
  userId: { firstName: string; lastName: string; profilePhoto?: string };
}

export interface PopulatedTripVehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

export interface PopulatedTripBranch {
  _id: string;
  name: string;
}

export interface Trip {
  _id: string;
  tripNumber: string;
  // Plain id on create; populated with summary info when listed.
  driverId: string | PopulatedTripDriver;
  vehicleId: string | PopulatedTripVehicle;
  branchId: string | PopulatedTripBranch;
  destinationBranchId?: string | PopulatedTripBranch;
  pickupLocation: TripLocation;
  dropoffLocation: TripLocation;
  status: TripStatus;
  estimatedEndTime: string;
  tripStartTime?: string;
  tripEndTime?: string;
  distance: number;
  fare: number;
  reassignmentReason?: string;
  proofOfDeliveryPhotoUrl?: string;
  publicTrackingToken?: string;
  publicRatingToken?: string;
  ratingSubmittedAt?: string;
  // Plain id array on create; populated with full delivery documents when listed/fetched.
  deliveryItems?: (string | Delivery)[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedByName?: string;
  createdAt: string;
}

export interface CreateTripPayload {
  driverId: string;
  vehicleId: string;
  branchId: string;
  destinationBranchId?: string;
  pickupLocation: TripLocation;
  dropoffLocation: TripLocation;
  estimatedEndTime: string;
  fare: number;
}
