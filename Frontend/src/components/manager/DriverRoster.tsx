import { useProfileStore } from '@/stores/profileStore';
import DriverDirectory from '@/components/shared/DriverDirectory';
import DriverApprovalList from './DriverApprovalList';

export default function DriverRoster() {
  const profile = useProfileStore((s) => s.profile);
  const branchId = profile?.manager?.assignedBranchId;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Pending Driver Approvals</h2>
        <DriverApprovalList />
      </div>
      <div>
        <h2 className="mb-2 font-semibold text-charcoal">My Drivers</h2>
        <DriverDirectory branchId={branchId} />
      </div>
    </div>
  );
}
