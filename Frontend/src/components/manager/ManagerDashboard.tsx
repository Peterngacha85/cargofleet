import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { AuthService } from '@/services/authService';
import { Branch } from '@/types/driver';
import TeamMap from './TeamMap';
import DriverApprovalList from './DriverApprovalList';
import BranchAnalytics from './BranchAnalytics';

export default function ManagerDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  useEffect(() => {
    Promise.all([DriverService.getBranches(), AuthService.getMe()]).then(([branchesRes, meRes]) => {
      const list = branchesRes.data?.branches ?? [];
      setBranches(list);

      const assignedBranchId = meRes.data?.manager?.assignedBranchId;
      setSelectedBranchId(assignedBranchId || list[0]?._id || '');
    });
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Branch Analytics</h2>
          <select
            className="input-field w-48"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {selectedBranchId && <BranchAnalytics branchId={selectedBranchId} />}
      </div>
    </div>
  );
}
