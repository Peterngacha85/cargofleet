export type PaymentMethod = 'cash' | 'mpesa';

export interface Payment {
  _id: string;
  driverId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}
