import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNavigate } from 'react-router-dom';

interface GoogleAuthButtonProps {
  role: 'driver' | 'manager';
}

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
    } catch (error) {
      push('Google sign-in failed', 'error');
    }
  };

  return (
    <GoogleLogin onSuccess={handleSuccess} onError={() => push('Google sign-in failed', 'error')} width="100%" />
  );
}
