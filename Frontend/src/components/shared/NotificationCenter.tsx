import { useNotificationStore } from '@/stores/notificationStore';
import clsx from 'clsx';

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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={clsx('cursor-pointer rounded-md px-4 py-2 shadow-md text-sm', typeStyles[n.type])}
          onClick={() => dismiss(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
