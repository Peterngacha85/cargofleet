import ManagerVerification from './ManagerVerification';
import DriverApprovalList from '@/components/manager/DriverApprovalList';

export default function UserManagement() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Pending Manager Verifications</h2>
        <ManagerVerification />
      </div>
      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Pending Driver Approvals</h2>
        <DriverApprovalList />
      </div>
    </div>
  );
}
