export type VehicleStatus = 'pending_verification' | 'active' | 'rejected' | 'maintenance' | 'retired';
export type VehicleType = 'motorcycle' | 'van' | 'truck' | 'lorry';
export type FuelType = 'petrol' | 'diesel' | 'electric';

export interface VehicleRegisteredBy {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Vehicle {
  _id: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: VehicleStatus;
  fuelType: FuelType;
  branchId: string | { _id: string; name: string };
  registeredBy?: string | VehicleRegisteredBy;
  registeredByName?: string;
  verifiedByName?: string;
  currentDriverId?: string;
  rejectionReason?: string;
  photoUrl?: string;
  totalTrips: number;
  maintenanceDue?: string;
  lastServiceDate?: string;
  documents?: {
    insuranceExpiry?: string;
    registrationExpiry?: string;
    inspectionExpiry?: string;
  };
}

export interface CreateVehiclePayload {
  registrationNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  capacity: number;
  branchId: string;
  fuelType: FuelType;
  photo: File;
  maintenanceDue?: string;
  lastServiceDate?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  inspectionExpiry?: string;
}

export interface UpdateVehiclePayload {
  vehicleType?: VehicleType;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  fuelType?: FuelType;
  photo?: File;
  maintenanceDue?: string;
  lastServiceDate?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  inspectionExpiry?: string;
}
