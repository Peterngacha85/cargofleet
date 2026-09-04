export interface ApiResponse<T = unknown> {
  success: boolean;
  status: 'success' | 'error';
  message: string;
  data: T | null;
  errors: Record<string, unknown> | null;
}

export type UserRole = 'driver' | 'manager' | 'admin';

export type DriverStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';
export type ManagerStatus = 'pending_verification' | 'active' | 'rejected' | 'inactive';
export type VehicleType = 'motorcycle' | 'van' | 'truck' | 'lorry';
export type VehicleStatus = 'pending_verification' | 'active' | 'rejected' | 'maintenance' | 'retired';
export type FuelType = 'petrol' | 'diesel' | 'electric';
export type TripStatus = 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export type ItemCondition = 'good' | 'damaged' | 'not_inspected';
export type RatedByType = 'manager' | 'customer';
export type QualityRating = 'excellent' | 'good' | 'average' | 'poor';
export type TimelinessRating = 'on_time' | 'slightly_late' | 'very_late';
export type PhotoType = 'proof_of_delivery' | 'damage_report' | 'vehicle_condition';
export type ArchiveStatus = 'active' | 'archived' | 'deleted';
export type ApprovableType = 'driver' | 'manager';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
