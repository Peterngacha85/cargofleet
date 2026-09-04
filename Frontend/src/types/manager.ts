import { PopulatedBranchSummary } from './driver';

export type ManagerStatus = 'pending_verification' | 'active' | 'rejected' | 'inactive';

export interface ManagerUserSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
}

export interface Manager {
  _id: string;
  userId: string | ManagerUserSummary;
  status: ManagerStatus;
  assignedBranchId?: string | PopulatedBranchSummary;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedByName?: string;
  totalDriversManaged: number;
  totalTripsOverseen: number;
  createdAt: string;
}
