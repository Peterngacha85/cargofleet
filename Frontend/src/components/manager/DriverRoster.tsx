import { useProfileStore } from '@/stores/profileStore';
import DriverDirectory from '@/components/shared/DriverDirectory';

export default function DriverRoster() {
  const profile = useProfileStore((s) => s.profile);
  const branchId = profile?.manager?.assignedBranchId;

  return <DriverDirectory branchId={branchId} />;
}
