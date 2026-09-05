import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

// A bare "No X yet." text node reads as broken next to the rest of the app's card-based
// pages - this gives every empty list the same small, deliberate look instead.
export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-1 py-10 text-center">
      <Icon className="h-8 w-8 text-gray-300" />
      <p className="font-medium text-charcoal">{title}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
