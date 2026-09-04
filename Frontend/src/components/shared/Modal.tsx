import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}

export default function Modal({ onClose, children, maxWidthClass = 'max-w-md' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className={`relative max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-lg bg-white p-6 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-charcoal"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
