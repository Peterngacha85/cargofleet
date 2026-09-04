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
  currentDriverId?: string;
  rejectionReason?: string;
  totalTrips: number;
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
}
