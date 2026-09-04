export type UserRole = 'driver' | 'manager' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  permissions?: string[];
  profilePhoto?: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface CurrentUserProfile extends AuthUser {
  profileComplete: boolean;
  driver?: {
    _id: string;
    status: string;
    branchId?: string;
    assignedVehicleId?: string;
    totalTrips: number;
    completedTrips: number;
    avgRating: number;
    totalEarnings: number;
  };
  manager?: {
    _id: string;
    status: string;
    assignedBranchId?: string;
    totalDriversManaged: number;
    totalTripsOverseen: number;
  };
}

export interface DriverRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  drivingLicenseNumber: string;
  licenseExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface ManagerRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}
