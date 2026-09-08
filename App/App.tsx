import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useAuthStore } from './src/stores/authStore';
import { useProfileStore } from './src/stores/profileStore';
import { storage } from './src/utils/storage';
import RootNavigator from './src/navigation/RootNavigator';
import ToastHost from './src/components/ToastHost';

export default function App() {
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  useEffect(() => {
    (async () => {
      const token = await storage.getAccessToken();
      if (!token) {
        setBootstrapped(null);
        return;
      }
      try {
        await fetchProfile();
        setBootstrapped(useProfileStore.getState().profile);
      } catch {
        await storage.clear();
        setBootstrapped(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.flex}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <ToastHost />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
