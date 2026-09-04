import Modal from '@/components/shared/Modal';
import Avatar from '@/components/shared/Avatar';
import DetailField from '@/components/shared/DetailField';
import { Manager, ManagerUserSummary } from '@/types/manager';
import { PopulatedBranchSummary } from '@/types/driver';
import { formatDate, statusLabel } from '@/utils/formatters';

interface ManagerDetailModalProps {
  manager: Manager;
  onClose: () => void;
}

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-200 text-gray-700',
};

export default function ManagerDetailModal({ manager, onClose }: ManagerDetailModalProps) {
  const user = manager.userId as ManagerUserSummary;
  const branch = manager.assignedBranchId as PopulatedBranchSummary | undefined;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 flex items-center gap-4">
        <Avatar role="manager" photoUrl={user?.profilePhoto} name={fullName || user?.email} size={64} />
        <div>
          <p className="text-lg font-semibold text-charcoal">{fullName || user?.email}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[manager.status]}`}>
            {statusLabel(manager.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Email" value={user?.email} />
        <DetailField label="Phone" value={user?.phone} />
        <DetailField label="Assigned Branch" value={branch?.name} />
        <DetailField label="Drivers Managed" value={manager.totalDriversManaged} />
        <DetailField label="Trips Overseen" value={manager.totalTripsOverseen} />
        <DetailField label="Verified By" value={manager.verifiedByName} />
        <DetailField label="Verified At" value={manager.verifiedAt ? formatDate(manager.verifiedAt) : undefined} />
        <DetailField label="Registered" value={manager.createdAt ? formatDate(manager.createdAt) : undefined} />
      </div>

      {manager.status === 'rejected' && manager.rejectionReason && (
        <p className="mt-4 text-sm text-red-600">Rejection reason: {manager.rejectionReason}</p>
      )}
    </Modal>
  );
}
