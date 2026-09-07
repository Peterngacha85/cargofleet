export type PhotoType = 'proof_of_delivery' | 'damage_report' | 'vehicle_condition';
export type ArchiveStatus = 'active' | 'archived' | 'deleted';

export interface PopulatedPhotoDriver {
  _id: string;
  userId: { firstName: string; lastName: string };
}

export interface PopulatedPhotoTrip {
  _id: string;
  tripNumber: string;
}

export interface Photo {
  _id: string;
  deliveryId: string;
  tripId: string | PopulatedPhotoTrip;
  driverId: string | PopulatedPhotoDriver;
  photoType: PhotoType;
  cloudflareUrl: string;
  uploadedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  archiveStatus: ArchiveStatus;
  archiveReason?: string;
  scheduledDeleteAt?: string;
  metadata: {
    filename: string;
    size: number;
    mimeType: string;
  };
}
