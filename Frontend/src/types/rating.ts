export type QualityRating = 'excellent' | 'good' | 'average' | 'poor';
export type TimelinessRating = 'on_time' | 'slightly_late' | 'very_late';

export interface DriverRating {
  _id: string;
  driverId: string;
  tripId: string;
  rating: number;
  ratedBy: 'manager' | 'customer';
  comment?: string;
  deliveryQuality: QualityRating;
  timeliness: TimelinessRating;
  professionalism: QualityRating;
  positiveAspects?: string[];
  negativeAspects?: string[];
  customerName?: string;
  createdAt: string;
}

export interface DriverRatingsResponse {
  ratings: DriverRating[];
  avgRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
}
