export type DriverStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

export interface DriverUserSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
}

export interface PopulatedBranchSummary {
  _id: string;
  name: string;
}

export interface Driver {
  _id: string;
  userId: string | DriverUserSummary;
  drivingLicenseNumber: string;
  licenseExpiry?: string;
  status: DriverStatus;
  branchId?: string | PopulatedBranchSummary;
  assignedVehicleId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByName?: string;
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
