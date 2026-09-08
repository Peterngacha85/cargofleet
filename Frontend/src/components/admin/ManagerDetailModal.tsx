import { useState } from 'react';
import Modal from '@/components/shared/Modal';
import Avatar from '@/components/shared/Avatar';
import DetailField from '@/components/shared/DetailField';
import { ManagerService } from '@/services/managerService';
import { useNotificationStore } from '@/stores/notificationStore';
import { confirmDialog } from '@/stores/dialogStore';
import { Manager, ManagerUserSummary } from '@/types/manager';
import { PopulatedBranchSummary } from '@/types/driver';
import { formatDate, statusLabel } from '@/utils/formatters';

interface ManagerDetailModalProps {
  manager: Manager;
  onClose: () => void;
  onDeleted?: () => void;
}

const statusStyles: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-200 text-gray-700',
};

export default function ManagerDetailModal({ manager, onClose, onDeleted }: ManagerDetailModalProps) {
  const user = manager.userId as ManagerUserSummary;
  const branch = manager.assignedBranchId as PopulatedBranchSummary | undefined;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const [deleting, setDeleting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete manager',
      message: `Delete ${fullName || user?.email}? This can be undone later, but they'll disappear from every list immediately.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await ManagerService.delete(manager._id);
      push(response.success ? 'Manager deleted.' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        onDeleted?.();
        onClose();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to delete manager', 'error');
    } finally {
      setDeleting(false);
    }
  };

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

      <div className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-red-600">Danger Zone</h3>
        <button
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          Delete Manager
        </button>
      </div>
    </Modal>
  );
}
