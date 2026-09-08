import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/Button';
import { colors } from '../theme';

const stat = (label: string, value: string | number) => (
  <View style={styles.statCard} key={label}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Rating history and performance breakdown (DriverRatingHistory.tsx port) land in Phase 4 -
// this covers the identity + at-a-glance stats + logout for now.
export default function ProfileScreen() {
  const profile = useProfileStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const driver = profile?.driver;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>

        <View style={styles.statsRow}>
          {stat('Rating', driver?.avgRating?.toFixed(1) ?? '—')}
          {stat('Trips', driver?.totalTrips ?? 0)}
          {stat('Completed', driver?.completedTrips ?? 0)}
        </View>

        <Button title="Log Out" variant="danger" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 20 },
  name: { fontSize: 20, fontWeight: '700', color: colors.charcoal },
  email: { fontSize: 14, color: colors.textMuted, marginTop: -14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.softGray, borderRadius: 10, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
