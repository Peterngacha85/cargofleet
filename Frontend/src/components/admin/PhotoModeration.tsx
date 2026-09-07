import { useEffect, useState } from 'react';
import { Image as ImageIcon, Archive, Trash2 } from 'lucide-react';
import { PhotoService } from '@/services/photoService';
import { Photo, ArchiveStatus } from '@/types/photo';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalsStore } from '@/stores/approvalsStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { formatDate, statusLabel } from '@/utils/formatters';
import Select from '@/components/shared/Select';
import EmptyState from '@/components/shared/EmptyState';

const statusStyles: Record<ArchiveStatus, string> = {
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-700',
  deleted: 'bg-red-100 text-red-700',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'deleted', label: 'Deleted' },
];

export default function PhotoModeration() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArchiveStatus | ''>('');
  const [actingOn, setActingOn] = useState<string | null>(null);
  const push = useNotificationStore((s) => s.push);
  const setActivePhotoCount = useApprovalsStore((s) => s.setActivePhotoCount);
  const { user } = useAuth();
  const socketRef = useSocket('admin', { adminId: user?.id ?? '' }, !!user);

  const load = () => {
    PhotoService.list(statusFilter ? { archiveStatus: statusFilter } : {}).then((res) =>
      setPhotos(res.data?.photos ?? [])
    );
  };

  // Kept separate from `load()` above so the sidebar badge always reflects the true active
  // count, not whatever status this page currently happens to be filtered to.
  const refreshActiveCount = () => {
    PhotoService.list({ archiveStatus: 'active' }).then((res) => setActivePhotoCount(res.data?.count ?? 0));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    refreshActiveCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live update: a driver marking a delivery item delivered can upload a proof photo at any
  // time, from anywhere - without this, this page (and the sidebar badge) only ever reflected
  // photos that existed when it was last loaded/refreshed.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Silent refresh only - DashboardPage's central listener already shows the "New photo
    // uploaded" toast app-wide, so this page would otherwise double it up while it's open.
    const handleNewPhoto = () => {
      refreshActiveCount();
      load();
    };

    socket.on('newPhotoUpload', handleNewPhoto);
    return () => {
      socket.off('newPhotoUpload', handleNewPhoto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const driverName = (photo: Photo) =>
    typeof photo.driverId === 'string'
      ? photo.driverId
      : `${photo.driverId.userId.firstName} ${photo.driverId.userId.lastName}`;

  const tripNumber = (photo: Photo) => (typeof photo.tripId === 'string' ? photo.tripId : photo.tripId.tripNumber);

  const handleArchive = async (photo: Photo) => {
    setActingOn(photo._id);
    try {
      const response = await PhotoService.archive(photo._id);
      push(response.success ? 'Photo archived.' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        load();
        refreshActiveCount();
      }
    } finally {
      setActingOn(null);
    }
  };

  const handleApproveDeletion = async (photo: Photo) => {
    if (!window.confirm('Permanently delete this photo? This cannot be undone.')) return;
    const reason = window.prompt('Reason for deletion (optional)') ?? undefined;
    setActingOn(photo._id);
    try {
      const response = await PhotoService.approveDeletion(photo._id, reason);
      push(response.success ? 'Photo deleted.' : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        load();
        refreshActiveCount();
      }
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-soft-gray pb-3">
        <h2 className="font-semibold text-charcoal">Photo Moderation</h2>
        <Select
          className="w-44"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ArchiveStatus | '')}
          options={statusOptions}
        />
      </div>

      {photos.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No photos" description="Nothing matches this filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo._id} className="card flex flex-col gap-2">
              <a href={photo.cloudflareUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={photo.cloudflareUrl}
                  alt={photo.photoType}
                  className="h-40 w-full rounded-lg object-cover"
                />
              </a>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-charcoal">{tripNumber(photo)}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[photo.archiveStatus]}`}>
                  {statusLabel(photo.archiveStatus)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {statusLabel(photo.photoType)} · {driverName(photo)}
              </p>
              <p className="text-xs text-gray-400">Uploaded {formatDate(photo.uploadedAt)}</p>
              {photo.archiveStatus === 'deleted' && photo.archiveReason && (
                <p className="text-xs text-red-600">Reason: {photo.archiveReason}</p>
              )}
              {photo.archiveStatus !== 'deleted' && (
                <div className="mt-1 flex gap-2">
                  {photo.archiveStatus === 'active' && (
                    <button
                      className="btn-secondary flex flex-1 items-center justify-center gap-1"
                      onClick={() => handleArchive(photo)}
                      disabled={actingOn === photo._id}
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  )}
                  <button
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    onClick={() => handleApproveDeletion(photo)}
                    disabled={actingOn === photo._id}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
