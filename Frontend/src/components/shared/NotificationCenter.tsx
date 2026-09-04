import { useNotificationStore } from '@/stores/notificationStore';
import clsx from 'clsx';
import { X } from 'lucide-react';

const typeStyles: Record<string, string> = {
  info: 'bg-charcoal text-white',
  success: 'bg-lime text-charcoal',
  warning: 'bg-yellow-400 text-charcoal',
  error: 'bg-red-500 text-white',
};

export default function NotificationCenter() {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismiss = useNotificationStore((s) => s.dismiss);

  if (notifications.length === 0) return null;

  return (
    // z-[9999]: same reason as CompleteProfileModal - stays above Leaflet's map panes/controls
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={clsx(
            'flex items-center gap-3 rounded-md py-2 pl-4 pr-2 shadow-md text-sm',
            typeStyles[n.type]
          )}
        >
          <span className="flex-1">{n.message}</span>
          <button
            onClick={() => dismiss(n.id)}
            className="rounded p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
