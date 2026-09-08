import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useNotificationStore } from '../../stores/notificationStore';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const push = useNotificationStore((s) => s.push);

  const handleLogin = async () => {
    if (!email || !password) {
      push('Enter your email and password', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const response = await AuthService.login(email.trim(), password);
      if (!response.success || !response.data) {
        push(response.message || 'Login failed', 'error');
        return;
      }
      if (response.data.user.role !== 'driver') {
        push('This app is for drivers only. Use the web dashboard for your account.', 'error');
        return;
      }
      await setSession(response.data.accessToken, response.data.refreshToken, response.data.user);
      await fetchProfile();
    } catch (error: any) {
      push(error?.response?.data?.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>CargoFleet</Text>
        <Text style={styles.subtitle}>Driver sign in</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
          />
          <Button title="Sign In" onPress={handleLogin} loading={submitting} />
        </View>

        <Text style={styles.footer}>
          New driver?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('RegisterDriver')}>
            Register here
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.charcoal, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: -16 },
  form: { gap: 14 },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  link: { color: colors.charcoal, fontWeight: '600', textDecorationLine: 'underline' },
});
