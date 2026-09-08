import { StyleSheet, Text, View } from 'react-native';
import { useNotificationStore } from '../stores/notificationStore';
import { colors } from '../theme';

const typeColors: Record<string, string> = {
  info: colors.charcoal,
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
};

// Minimal on-screen toast stack - no need to match the web app's exact notification UI,
// just needs to surface success/error feedback from API calls.
export default function ToastHost() {
  const notifications = useNotificationStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {notifications.map((n) => (
        <View key={n.id} style={[styles.toast, { backgroundColor: typeColors[n.type] }]}>
          <Text style={styles.text}>{n.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 100,
  },
  toast: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
