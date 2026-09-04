import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNavigate } from 'react-router-dom';

interface GoogleAuthButtonProps {
  role: 'driver' | 'manager';
}

// Google sign-in on a fresh, never-registered account creates the driver/manager record
// (same as manual registration) but can't log them in yet - these map that gate to a
// message that reads as "you're registered" rather than "something went wrong".
const PENDING_STATUS_MESSAGES: Record<string, string> = {
  pending_approval: 'Account created with Google - pending branch manager approval.',
  pending_verification: 'Account created with Google - pending super admin verification.',
  rejected: 'This registration was previously rejected. Contact your branch manager for details.',
  suspended: 'This account has been suspended.',
  inactive: 'This account is inactive.',
};

export default function GoogleAuthButton({ role }: GoogleAuthButtonProps) {
  const { setSession } = useAuth();
  const push = useNotificationStore((s) => s.push);
  const navigate = useNavigate();

  const handleSuccess = async (credential: CredentialResponse) => {
    if (!credential.credential) return;

    try {
      const response = await AuthService.googleLogin(credential.credential, role);
      if (response.success && response.data) {
        setSession(response.data.accessToken, response.data.refreshToken, response.data.user);
        push('Signed in with Google', 'success');
        navigate('/dashboard');
      } else {
        push(response.message, 'error');
      }
    } catch (error: any) {
      const rawStatus = error?.response?.data?.errors?.status;
      const friendlyMessage = rawStatus && PENDING_STATUS_MESSAGES[rawStatus];

      if (error?.response?.status === 403 && friendlyMessage) {
        push(friendlyMessage, 'info');
        navigate('/login');
      } else {
        push(error?.response?.data?.message || 'Google sign-in failed', 'error');
      }
    }
  };

  return (
    <GoogleLogin onSuccess={handleSuccess} onError={() => push('Google sign-in failed', 'error')} width="100%" />
  );
}
