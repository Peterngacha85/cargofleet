import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Placeholder - built out in Phase 2 as a port of Frontend/src/components/driver/MyTrips.tsx
// (trip list, Start Trip, live location sharing, cargo items).
export default function TripsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.text}>Your trips will show up here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softGray },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
