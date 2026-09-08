import { UsersRound, Users, UserX } from 'lucide-react';
import ManagerVerification from './ManagerVerification';
import DriverApprovalList from '@/components/manager/DriverApprovalList';
import DriverDeletionRequests from './DriverDeletionRequests';

export default function UserManagement() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-charcoal">
          <UsersRound className="h-4 w-4 text-lime" />
          Pending Manager Verifications
        </h2>
        <ManagerVerification />
      </div>
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-charcoal">
          <Users className="h-4 w-4 text-lime" />
          Pending Driver Approvals
        </h2>
        <DriverApprovalList />
      </div>
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-charcoal">
          <UserX className="h-4 w-4 text-lime" />
          Pending Driver Deletion Requests
        </h2>
        <DriverDeletionRequests />
      </div>
    </div>
  );
}
