export type DriverStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

export interface DriverUserSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Driver {
  _id: string;
  userId: string | DriverUserSummary;
  drivingLicenseNumber: string;
  status: DriverStatus;
  branchId?: string;
  assignedVehicleId?: string;
  totalTrips: number;
  completedTrips: number;
  avgRating: number;
  totalEarnings: number;
  createdAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  vehicleCount: number;
  driverCount: number;
}
