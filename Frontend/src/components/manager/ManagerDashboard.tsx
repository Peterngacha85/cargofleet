import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { useProfileStore } from '@/stores/profileStore';
import { Branch } from '@/types/driver';
import TeamMap from '@/components/shared/TeamMap';
import DriverApprovalList from './DriverApprovalList';
import BranchAnalytics from './BranchAnalytics';

export default function ManagerDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const profile = useProfileStore((s) => s.profile);
  // A manager only ever sees their own branch's analytics - unlike admin, there's no picker
  // to switch to another branch's numbers.
  const branchId = profile?.manager?.assignedBranchId;
  const branchName = branches.find((b) => b._id === branchId)?.name;

  useEffect(() => {
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Team Location</h2>
        </div>
        <TeamMap />
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">Pending Driver Approvals</h2>
        <DriverApprovalList />
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-charcoal">
          Branch Analytics{branchName ? ` — ${branchName}` : ''}
        </h2>
        {branchId && <BranchAnalytics branchId={branchId} />}
      </div>
    </div>
  );
}
