export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export type ItemCondition = 'good' | 'damaged' | 'not_inspected';

export interface Delivery {
  _id: string;
  tripId: string;
  deliveryNumber: string;
  description: string;
  quantity: number;
  weight: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: DeliveryStatus;
  condition: {
    initial: ItemCondition;
    final: ItemCondition;
  };
  proofOfDeliveryPhoto?: string;
  customerSignatureRequired: boolean;
  signatureProvided?: boolean;
  deliveredAt?: string;
  failureReason?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateDeliveryPayload {
  tripId: string;
  description: string;
  quantity: number;
  weight: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  customerSignatureRequired?: boolean;
}
