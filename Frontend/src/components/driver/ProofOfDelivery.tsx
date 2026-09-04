import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { FileService } from '@/services/fileService';
import { useNotificationStore } from '@/stores/notificationStore';

interface ProofOfDeliveryProps {
  deliveryId: string;
  tripId: string;
  onUploaded?: () => void;
}

export default function ProofOfDelivery({ deliveryId, tripId, onUploaded }: ProofOfDeliveryProps) {
  const [uploading, setUploading] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      try {
        const response = await FileService.uploadDeliveryPhoto(file, deliveryId, tripId);
        if (response.success) {
          push('Proof of delivery uploaded', 'success');
          onUploaded?.();
        } else {
          push(response.message, 'error');
        }
      } catch {
        push('Upload failed', 'error');
      } finally {
        setUploading(false);
      }
    },
    [deliveryId, tripId, onUploaded, push]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center ${
        isDragActive ? 'border-lime bg-lime/10' : 'border-gray-300'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-8 w-8 text-gray-400" />
      <p className="text-sm text-gray-500">
        {uploading ? 'Uploading…' : 'Drop a delivery photo here, or click to select one'}
      </p>
    </div>
  );
}
