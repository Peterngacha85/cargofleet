import { useEffect, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import DetailField from './DetailField';
import Select from './Select';
import FieldLabel from './FieldLabel';
import DriverRatingHistory from './DriverRatingHistory';
import DriverPayments from './DriverPayments';
import { DriverService } from '@/services/driverService';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { Driver, DriverUserSummary, PopulatedBranchSummary, Branch } from '@/types/driver';
import { formatCurrency, formatDate, statusLabel } from '@/utils/formatters';

interface DriverDetailModalProps {
  driver: Driver;
  onClose: () => void;
  onReassigned?: () => void;
}

const statusStyles: Record<string, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-200 text-gray-700',
};

export default function DriverDetailModal({ driver, onClose, onReassigned }: DriverDetailModalProps) {
  const user = driver.userId as DriverUserSummary;
  const branch = driver.branchId as PopulatedBranchSummary | undefined;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const { role } = useAuth();
  const canReassign = role === 'admin';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranchId, setNewBranchId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [totalPaid, setTotalPaid] = useState(driver.totalPaid ?? 0);
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    if (canReassign && driver.status === 'active') {
      DriverService.getBranches().then((res) => setBranches(res.data?.branches ?? []));
    }
  }, [canReassign, driver.status]);

  const handleReassign = async () => {
    if (!newBranchId) {
      push('Select a branch to reassign this driver to.', 'warning');
      return;
    }
    setReassigning(true);
    try {
      const response = await DriverService.reassignBranch(driver._id, newBranchId);
      push(response.message, response.success ? 'success' : 'error');
      if (response.success) {
        onReassigned?.();
        onClose();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to reassign driver', 'error');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 flex items-center gap-4">
        <Avatar role="driver" photoUrl={user?.profilePhoto} name={fullName || user?.email} size={64} />
        <div>
          <p className="text-lg font-semibold text-charcoal">{fullName || user?.email}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[driver.status]}`}>
            {statusLabel(driver.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Email" value={user?.email} />
        <DetailField label="Phone" value={user?.phone} />
        <DetailField label="Branch" value={branch?.name} />
        <DetailField label="Driving License Number" value={driver.drivingLicenseNumber} />
        <DetailField
          label="License Expiry"
          value={driver.licenseExpiry ? formatDate(driver.licenseExpiry) : undefined}
        />
        <DetailField label="Emergency Contact Name" value={driver.emergencyContactName} />
        <DetailField label="Emergency Contact Phone" value={driver.emergencyContactPhone} />
        <DetailField label="Approved By" value={driver.approvedByName} />
        <DetailField label="Approved At" value={driver.approvedAt ? formatDate(driver.approvedAt) : undefined} />
        <DetailField label="Average Rating" value={driver.avgRating} />
        <DetailField label="Total Trips" value={driver.totalTrips} />
        <DetailField label="Completed Trips" value={driver.completedTrips} />
        <DetailField label="Total Earnings" value={formatCurrency(driver.totalEarnings ?? 0)} />
        <DetailField label="Registered" value={driver.createdAt ? formatDate(driver.createdAt) : undefined} />
      </div>

      {driver.status === 'rejected' && driver.rejectionReason && (
        <p className="mt-4 text-sm text-red-600">Rejection reason: {driver.rejectionReason}</p>
      )}

      <div className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-charcoal">Payments</h3>
        <DriverPayments
          driverId={driver._id}
          totalEarnings={driver.totalEarnings ?? 0}
          totalPaid={totalPaid}
          onPaid={setTotalPaid}
        />
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-charcoal">Ratings</h3>
        <DriverRatingHistory driverId={driver._id} />
      </div>

      {canReassign && driver.status === 'active' && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <FieldLabel>Reassign Branch</FieldLabel>
          <p className="mb-2 text-xs text-gray-400">
            Fixes a driver claimed into the wrong branch by mistake during approval.
          </p>
          <div className="flex gap-2">
            <Select
              value={newBranchId}
              onChange={setNewBranchId}
              placeholder="Select new branch"
              options={branches.filter((b) => b._id !== branch?._id).map((b) => ({ value: b._id, label: b.name }))}
            />
            <button className="btn-secondary whitespace-nowrap" onClick={handleReassign} disabled={reassigning}>
              {reassigning ? 'Moving…' : 'Reassign'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
