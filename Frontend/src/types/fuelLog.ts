export interface FuelLog {
  _id: string;
  vehicleId: string;
  tripId?: string;
  driverId: string;
  liters: number;
  cost: number;
  odometerReading?: number;
  receiptPhotoUrl?: string;
  loggedBy: string;
  createdAt: string;
}

export interface FuelLogTotals {
  liters: number;
  cost: number;
}
