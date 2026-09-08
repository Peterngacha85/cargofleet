import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { useNotificationStore } from '../stores/notificationStore';
import { GOOGLE_ANDROID_CLIENT_ID } from '../config/env';
import Button from './Button';

// Required once per app so the browser tab opened for the Google consent screen resolves the
// pending promise instead of leaving promptAsync() hanging when it redirects back.
WebBrowser.maybeCompleteAuthSession();

// A fresh Google sign-in with no existing account auto-creates a pending driver record
// (same as the manual registration flow) but can't log them in yet - mirrors
// Frontend/src/components/auth/GoogleAuthButton.tsx's PENDING_STATUS_MESSAGES mapping so a
// first-time Google sign-in on mobile reads as "you're registered", not "something went wrong".
const PENDING_STATUS_MESSAGES: Record<string, string> = {
  pending_approval: 'Account created with Google - pending branch manager approval.',
  rejected: 'This registration was previously rejected. Contact your branch manager for details.',
  suspended: 'This account has been suspended.',
  inactive: 'This account is inactive.',
};

export default function GoogleAuthButton() {
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const push = useNotificationStore((s) => s.push);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (!idToken) return;

    (async () => {
      setSubmitting(true);
      try {
        const result = await AuthService.googleLogin(idToken);
        if (!result.success || !result.data) {
          push(result.message || 'Google sign-in failed', 'error');
          return;
        }
        if (result.data.user.role !== 'driver') {
          push('This app is for drivers only. Use the web dashboard for your account.', 'error');
          return;
        }
        await setSession(result.data.accessToken, result.data.refreshToken, result.data.user);
        await fetchProfile();
      } catch (error: any) {
        const status = error?.response?.data?.errors?.status;
        const friendlyMessage = status && PENDING_STATUS_MESSAGES[status];
        push(friendlyMessage || error?.response?.data?.message || 'Google sign-in failed', friendlyMessage ? 'info' : 'error');
      } finally {
        setSubmitting(false);
      }
    })();
  }, [response]);

  if (!GOOGLE_ANDROID_CLIENT_ID) return null;

  return (
    <Button
      title="Continue with Google"
      variant="secondary"
      onPress={() => promptAsync()}
      disabled={!request}
      loading={submitting}
    />
  );
}
