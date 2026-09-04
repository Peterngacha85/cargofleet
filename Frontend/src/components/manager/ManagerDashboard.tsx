import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { useProfileStore } from '@/stores/profileStore';
import { Branch } from '@/types/driver';
import TeamMap from '@/components/shared/TeamMap';
import DriverApprovalList from './DriverApprovalList';
import BranchAnalytics from './BranchAnalytics';
import Select from '@/components/shared/Select';

export default function ManagerDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
  }, []);

  useEffect(() => {
    if (selectedBranchId) return;
    const assignedBranchId = profile?.manager?.assignedBranchId;
    if (assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
    } else if (branches[0]) {
      setSelectedBranchId(branches[0]._id);
    }
  }, [profile, branches, selectedBranchId]);

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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Branch Analytics</h2>
          <Select
            className="w-48"
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            options={branches.map((b) => ({ value: b._id, label: b.name }))}
          />
        </div>
        {selectedBranchId && <BranchAnalytics branchId={selectedBranchId} />}
      </div>
    </div>
  );
}
