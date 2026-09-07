import { useState } from 'react';
import { Package, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { DeliveryService } from '@/services/deliveryService';
import { FileService } from '@/services/fileService';
import { Trip } from '@/types/trip';
import { Delivery, ItemCondition } from '@/types/delivery';
import { useNotificationStore } from '@/stores/notificationStore';
import { statusLabel } from '@/utils/formatters';
import SignatureCanvas from '@/components/shared/SignatureCanvas';

interface CargoItemsPanelProps {
  trip: Trip;
  driverId: string;
  onUpdated: () => void;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  in_transit: 'bg-lime text-charcoal',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  returned: 'bg-red-100 text-red-700',
};

export default function CargoItemsPanel({ trip, driverId, onUpdated }: CargoItemsPanelProps) {
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [action, setAction] = useState<'deliver' | 'fail' | null>(null);
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [failureReason, setFailureReason] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const items = (trip.deliveryItems ?? []).filter((item): item is Delivery => typeof item !== 'string');

  if (items.length === 0) return null;

  const openAction = (itemId: string, kind: 'deliver' | 'fail') => {
    setActingOn(itemId);
    setAction(kind);
    setCondition('good');
    setFailureReason('');
    setPhoto(null);
    setHasSignature(false);
  };

  const cancel = () => {
    setActingOn(null);
    setAction(null);
  };

  const handleConfirmDelivered = async (item: Delivery) => {
    if (item.customerSignatureRequired && !hasSignature) {
      push('Customer signature is required for this item.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let proofOfDeliveryPhoto: string | undefined;
      if (photo) {
        const photoRes = await FileService.uploadDeliveryPhoto(photo, item._id, trip._id, driverId);
        if (!photoRes.success) {
          push(photoRes.message, 'error');
          setSubmitting(false);
          return;
        }
        proofOfDeliveryPhoto = photoRes.data?.photo._id;
      }

      const response = await DeliveryService.updateStatus(item._id, {
        status: 'delivered',
        finalCondition: condition,
        proofOfDeliveryPhoto,
        signatureProvided: item.customerSignatureRequired ? hasSignature : undefined,
      });
      push(response.success ? `${item.description} marked delivered.` : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        cancel();
        onUpdated();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to update item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmFailed = async (item: Delivery) => {
    if (!failureReason.trim()) {
      push('Enter a reason this item could not be delivered.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await DeliveryService.updateStatus(item._id, { status: 'failed', failureReason });
      push(response.success ? `${item.description} marked as failed.` : response.message, response.success ? 'success' : 'error');
      if (response.success) {
        cancel();
        onUpdated();
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to update item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 pt-2">
      <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        <Package className="h-3.5 w-3.5" />
        Cargo Items
      </p>
      {items.map((item) => {
        const isOpen = actingOn === item._id;
        const isSettled = item.status === 'delivered' || item.status === 'failed' || item.status === 'returned';

        return (
          <div key={item._id} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-charcoal">
                  {item.description} · {item.quantity} pc(s)
                </p>
                <p className="text-xs text-gray-500">
                  To: {item.receiverName} · {item.deliveryAddress}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>
                {statusLabel(item.status)}
              </span>
            </div>

            {!isSettled && !isOpen && (
              <div className="mt-2 flex gap-2">
                <button
                  className="btn-primary flex items-center gap-1 !py-1 text-xs"
                  onClick={() => openAction(item._id, 'deliver')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Delivered
                </button>
                <button
                  className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  onClick={() => openAction(item._id, 'fail')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Mark Failed
                </button>
              </div>
            )}

            {isOpen && action === 'deliver' && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={condition === 'good'}
                      onChange={() => setCondition('good')}
                    />
                    Good condition
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={condition === 'damaged'}
                      onChange={() => setCondition('damaged')}
                    />
                    Damaged
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <Camera className="h-3.5 w-3.5" />
                    Photo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="input-field mt-1"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </div>
                {item.customerSignatureRequired && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Customer signature required</p>
                    <SignatureCanvas onChange={setHasSignature} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    className="btn-primary !py-1 text-xs"
                    onClick={() => handleConfirmDelivered(item)}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Confirm Delivered'}
                  </button>
                  <button className="btn-secondary !py-1 text-xs" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isOpen && action === 'fail' && (
              <div className="mt-3 flex flex-col gap-3">
                <input
                  className="input-field"
                  placeholder="Reason (e.g. receiver not available)"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    onClick={() => handleConfirmFailed(item)}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Confirm Failed'}
                  </button>
                  <button className="btn-secondary !py-1 text-xs" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {item.failureReason && item.status === 'failed' && (
              <p className="mt-2 text-xs text-red-600">Reason: {item.failureReason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
