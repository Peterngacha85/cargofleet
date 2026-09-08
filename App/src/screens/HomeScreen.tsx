import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/profileStore';
import { colors } from '../theme';

// Built out in Phase 2 with the active-trips list and live location sharing toggle
// (DriverDashboard.tsx's equivalent). For now, just confirms login + profile fetch works.
export default function HomeScreen() {
  const profile = useProfileStore((s) => s.profile);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.greeting}>Hi, {profile?.firstName ?? 'Driver'}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Account status</Text>
        <Text style={styles.cardValue}>{profile?.driver?.status ?? 'Unknown'}</Text>
      </View>
      <Text style={styles.hint}>Trip assignment and live location sharing are coming in the next update.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softGray, padding: 20, gap: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.charcoal },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, gap: 4 },
  cardLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' },
  cardValue: { fontSize: 18, fontWeight: '600', color: colors.charcoal, textTransform: 'capitalize' },
  hint: { fontSize: 13, color: colors.textMuted },
});
