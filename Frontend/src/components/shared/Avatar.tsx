import { useState } from 'react';
import { UserRole } from '@/types/auth';

interface AvatarProps {
  role: UserRole;
  photoUrl?: string;
  name?: string;
  size?: number;
}

export default function Avatar({ role, photoUrl, name, size = 32 }: AvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const dimension = { width: size, height: size };

  if (role === 'admin') {
    return (
      <img
        src="/icons/app-icon.png"
        alt="Admin"
        title={name}
        style={dimension}
        className="rounded-full border-2 border-lime object-cover"
      />
    );
  }

  if (photoUrl && !photoFailed) {
    return (
      <img
        src={photoUrl}
        alt={name ?? 'Profile'}
        title={name}
        style={dimension}
        // Google's photo CDN often rejects requests based on the page's Referer header
        // (especially from localhost), so omit it entirely rather than fail to load.
        referrerPolicy="no-referrer"
        onError={() => setPhotoFailed(true)}
        className="rounded-full border-2 border-lime object-cover"
      />
    );
  }

  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      style={dimension}
      title={name}
      className="flex items-center justify-center rounded-full border-2 border-lime bg-charcoal font-semibold text-lime"
    >
      {initial}
    </div>
  );
}
