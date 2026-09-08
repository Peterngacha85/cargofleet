import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthService } from '../services/authService';
import { useProfileStore } from '../stores/profileStore';
import { useNotificationStore } from '../stores/notificationStore';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { colors } from '../theme';

// Only reachable for a driver account created via Google OAuth on the web dashboard, which
// skips collecting these fields at signup (see CompleteProfileModal.tsx on the web side) -
// the mobile registration form always collects them upfront, so this never fires for an
// account created here.
export default function CompleteProfileScreen() {
  const [phone, setPhone] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const push = useNotificationStore((s) => s.push);

  const handleSave = async () => {
    if (!phone || !drivingLicenseNumber || !licenseExpiry || !emergencyContactName || !emergencyContactPhone) {
      push('All fields are required.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const response = await AuthService.completeProfile({
        phone,
        drivingLicenseNumber,
        licenseExpiry,
        emergencyContactName,
        emergencyContactPhone,
      });
      if (response.success) {
        push('Profile completed', 'success');
        await fetchProfile();
      } else {
        push(response.message || 'Failed to update profile', 'error');
      }
    } catch (error: any) {
      push(error?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        You signed up with Google, so we're missing a few details. Add them below to get assigned trips.
      </Text>

      <View style={styles.form}>
        <TextField label="Phone" required placeholder="+254712345678" value={phone} onChangeText={setPhone} />
        <TextField
          label="Driving License Number"
          required
          value={drivingLicenseNumber}
          onChangeText={setDrivingLicenseNumber}
        />
        <TextField
          label="License Expiry"
          required
          placeholder="YYYY-MM-DD"
          value={licenseExpiry}
          onChangeText={setLicenseExpiry}
        />
        <TextField
          label="Emergency Contact Name"
          required
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
        />
        <TextField
          label="Emergency Contact Phone"
          required
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
        />
        <Button title="Save Profile" onPress={handleSave} loading={submitting} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 16, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '700', color: colors.charcoal },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: -8 },
  form: { gap: 14, marginTop: 8 },
});
