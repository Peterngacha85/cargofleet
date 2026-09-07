import { useEffect, useState } from 'react';
import { useDialogStore } from '@/stores/dialogStore';
import Modal from './Modal';

export default function DialogHost() {
  const request = useDialogStore((s) => s.request);
  const close = useDialogStore((s) => s.close);
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [request]);

  if (!request) return null;

  const handleCancel = () => {
    if (request.kind === 'confirm') request.resolve(false);
    else request.resolve(null);
    close();
  };

  const handleConfirm = () => {
    if (request.kind === 'confirm') {
      request.resolve(true);
    } else {
      request.resolve(value.trim() || null);
    }
    close();
  };

  return (
    <Modal onClose={handleCancel} maxWidthClass="max-w-sm">
      <h3 className="mb-2 pr-6 font-semibold text-charcoal">{request.title}</h3>
      {request.message && <p className="mb-3 text-sm text-gray-500">{request.message}</p>}
      {request.kind === 'prompt' && (
        <input
          autoFocus
          className="input-field mb-4"
          placeholder={request.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
      )}
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={handleCancel}>
          Cancel
        </button>
        <button
          className={
            request.kind === 'confirm' && request.danger
              ? 'rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100'
              : 'btn-primary'
          }
          onClick={handleConfirm}
        >
          {request.confirmLabel ?? (request.kind === 'confirm' ? 'Confirm' : 'Submit')}
        </button>
      </div>
    </Modal>
  );
}
