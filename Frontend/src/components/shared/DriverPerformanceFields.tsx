import { useEffect, useState } from 'react';
import { DriverService } from '@/services/driverService';
import { DriverPerformance } from '@/types/performance';
import DetailField from './DetailField';

interface DriverPerformanceFieldsProps {
  driverId: string;
}

// Returns a fragment (not a card) so it drops straight into whatever DetailField grid the
// caller already has for a driver's other stats, on both the manager/admin detail modal and a
// driver's own profile page.
export default function DriverPerformanceFields({ driverId }: DriverPerformanceFieldsProps) {
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);

  useEffect(() => {
    DriverService.getPerformance(driverId).then((res) => {
      if (res.data) setPerformance(res.data);
    });
  }, [driverId]);

  if (!performance || performance.totalCompletedTrips === 0) {
    return <DetailField label="On-Time Rate" value="No completed trips yet" />;
  }

  return (
    <>
      <DetailField
        label="On-Time Rate"
        value={`${performance.onTimePercentage}% (${performance.onTimeCount}/${performance.totalCompletedTrips})`}
      />
      <DetailField label="Damage Incidents" value={performance.damageIncidents} />
    </>
  );
}
