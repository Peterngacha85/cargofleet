import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { Branch } from '@/types/driver';
import BranchAnalytics from '@/components/manager/BranchAnalytics';

export default function SystemAnalytics() {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {branches.map((branch) => (
        <div key={branch._id}>
          <h3 className="mb-2 font-semibold text-charcoal">{branch.name}</h3>
          <BranchAnalytics branchId={branch._id} />
        </div>
      ))}
    </div>
  );
}
