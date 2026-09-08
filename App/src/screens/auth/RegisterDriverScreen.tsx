import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/authService';
import { useNotificationStore } from '../../stores/notificationStore';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterDriver'>;

export default function RegisterDriverScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [licensePhotoUri, setLicensePhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const push = useNotificationStore((s) => s.push);

  const pickLicensePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      push('Photo library access is required to attach a license photo.', 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setLicensePhotoUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !drivingLicenseNumber) {
      push('Fill in all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        firstName,
        lastName,
        phone,
        drivingLicenseNumber,
        licenseExpiry,
        emergencyContactName,
        emergencyContactPhone,
      };
      const licensePhoto = licensePhotoUri
        ? { uri: licensePhotoUri, name: 'license.jpg', type: 'image/jpeg' }
        : undefined;
      const response = await AuthService.registerDriver(payload, licensePhoto);
      if (!response.success) {
        push(response.message || 'Registration failed', 'error');
        return;
      }
      push('Registration submitted. A branch manager will review and approve your account.', 'success');
      navigation.navigate('Login');
    } catch (error: any) {
      push(error?.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>

      <View style={styles.form}>
        <TextField label="Email" required keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextField label="Password" required secureTextEntry value={password} onChangeText={setPassword} />
        <TextField label="First Name" required value={firstName} onChangeText={setFirstName} />
        <TextField label="Last Name" required value={lastName} onChangeText={setLastName} />
        <TextField label="Phone" placeholder="+254712345678" value={phone} onChangeText={setPhone} />
        <TextField
          label="Driving License Number"
          required
          value={drivingLicenseNumber}
          onChangeText={setDrivingLicenseNumber}
        />
        <TextField
          label="License Expiry"
          placeholder="YYYY-MM-DD"
          value={licenseExpiry}
          onChangeText={setLicenseExpiry}
        />
        <TextField
          label="Emergency Contact Name"
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
        />
        <TextField
          label="Emergency Contact Phone"
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
        />

        <View style={styles.photoRow}>
          {licensePhotoUri && <Image source={{ uri: licensePhotoUri }} style={styles.preview} />}
          <Button
            title={licensePhotoUri ? 'Change License Photo' : 'Add License Photo (optional)'}
            variant="secondary"
            onPress={pickLicensePhoto}
          />
        </View>

        <Button title="Register" onPress={handleRegister} loading={submitting} />
      </View>

      <Text style={styles.footer}>
        Already registered?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Sign in
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '700', color: colors.charcoal, textAlign: 'center' },
  form: { gap: 14 },
  photoRow: { gap: 10, alignItems: 'flex-start' },
  preview: { width: 100, height: 70, borderRadius: 8 },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 24 },
  link: { color: colors.charcoal, fontWeight: '600', textDecorationLine: 'underline' },
});
