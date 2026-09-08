import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import SplashScreen from '../screens/SplashScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

export default function RootNavigator() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profile = useProfileStore((s) => s.profile);
  const profileLoaded = useProfileStore((s) => s.loaded);

  if (!bootstrapped) return <SplashScreen />;
  if (!isAuthenticated) return <AuthStack />;
  // A fresh login has set isAuthenticated but the follow-up fetchProfile() call (which pulls
  // in the driver sub-object the login response doesn't include) may still be in flight.
  if (!profileLoaded) return <SplashScreen />;
  if (profile && !profile.profileComplete) return <CompleteProfileScreen />;

  return <AppTabs />;
}
